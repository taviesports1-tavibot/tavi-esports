import { fail, ok, validationDetails } from "@/lib/api";
import { getSession, isAdmin } from "@/lib/auth";
import { db, hasDatabase } from "@/lib/db";
import { calculateStandings, createGroups, createPlayoff, createQualification, type GroupResult, type MatchSource, type PlannedMatch, type TournamentSeed } from "@/lib/tournament-engine";
import { stageGenerationSchema } from "@/lib/validation";
import type { TransactionSql } from "postgres";

type Context = { params: Promise<{ id: string }> };

function registrationId(source: MatchSource) {
  return source.type === "registration" ? source.registrationId : null;
}

export async function POST(request: Request, context: Context) {
  const user = await getSession();
  if (!isAdmin(user)) return fail("Недостатньо прав", 403);
  if (!hasDatabase()) return fail("PostgreSQL не підключено", 503);
  const parsed = stageGenerationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Невідомий етап", 422, validationDetails(parsed.error));
  const { id } = await context.params;

  try {
    const result = await db().begin(async (sql) => {
      const tournamentRows = await sql`SELECT id, slots FROM tournaments WHERE id = ${id} FOR UPDATE`;
      if (!tournamentRows.length) throw new Error("TOURNAMENT_NOT_FOUND");
      const exists = await sql`SELECT id FROM tournament_stages WHERE tournament_id = ${id} AND stage_type = ${parsed.data.phase}`;
      if (exists.length) throw new Error("STAGE_EXISTS");

      if (parsed.data.phase === "qualification") {
        const rows = await sql`
          SELECT tr.id, COALESCE(t.name, u.nickname) AS name, COALESCE(tr.seed, row_number() OVER (ORDER BY tr.created_at))::int AS seed
          FROM tournament_registrations tr LEFT JOIN teams t ON t.id = tr.team_id LEFT JOIN users u ON u.id = tr.player_id
          WHERE tr.tournament_id = ${id} AND tr.status = 'approved' ORDER BY seed, tr.created_at
        `;
        const teams = rows.map((row) => ({ id: String(row.id), name: String(row.name), seed: Number(row.seed) }));
        if (teams.length < 16 || teams.length > 256) throw new Error("INVALID_TEAM_COUNT");
        const stageRows = await sql`INSERT INTO tournament_stages (tournament_id, stage_type, name, stage_order, status, best_of) VALUES (${id}, 'qualification', 'Кваліфікація', 1, 'ready', 1) RETURNING id`;
        const stageId = stageRows[0].id;
        if (teams.length === 16) {
          for (let index = 0; index < teams.length; index++) {
            await sql`INSERT INTO tournament_stage_advancements (stage_id, registration_id, advancement_order) VALUES (${stageId}, ${teams[index].id}, ${index + 1})`;
          }
          await sql`UPDATE tournament_stages SET status = 'completed' WHERE id = ${stageId}`;
          return { phase: parsed.data.phase, matches: 0, advanced: 16 };
        }
        const bracketRows = await sql`INSERT INTO brackets (tournament_id, name, bracket_stage, published) VALUES (${id}, 'Кваліфікація', 'qualification', true) RETURNING id`;
        const created = await insertMatches(sql, id, stageId, bracketRows[0].id, createQualification(teams));
        return { phase: parsed.data.phase, matches: created, advanced: 0 };
      }

      if (parsed.data.phase === "groups") {
        const qualification = await sql`SELECT id FROM tournament_stages WHERE tournament_id = ${id} AND stage_type = 'qualification'`;
        if (!qualification.length) throw new Error("QUALIFICATION_REQUIRED");
        const rows = await sql`
          SELECT tsa.registration_id AS id, COALESCE(t.name, u.nickname) AS name, tsa.advancement_order::int AS seed
          FROM tournament_stage_advancements tsa
          JOIN tournament_registrations tr ON tr.id = tsa.registration_id
          LEFT JOIN teams t ON t.id = tr.team_id LEFT JOIN users u ON u.id = tr.player_id
          WHERE tsa.stage_id = ${qualification[0].id} ORDER BY tsa.advancement_order
        `;
        const teams = rows.map((row) => ({ id: String(row.id), name: String(row.name), seed: Number(row.seed) }));
        const groups = createGroups(teams);
        const stageRows = await sql`INSERT INTO tournament_stages (tournament_id, stage_type, name, stage_order, status, best_of) VALUES (${id}, 'groups', 'Груповий етап', 2, 'ready', 1) RETURNING id`;
        const stageId = stageRows[0].id;
        const bracketRows = await sql`INSERT INTO brackets (tournament_id, name, bracket_stage, published) VALUES (${id}, 'Груповий етап', 'groups', true) RETURNING id`;
        let matchNumber = 0;
        for (let index = 0; index < groups.length; index++) {
          const group = groups[index];
          const groupRows = await sql`INSERT INTO tournament_groups (tournament_id, stage_id, name, group_order) VALUES (${id}, ${stageId}, ${group.name}, ${index + 1}) RETURNING id`;
          for (let seed = 0; seed < group.members.length; seed++) {
            await sql`INSERT INTO tournament_group_members (group_id, registration_id, group_seed) VALUES (${groupRows[0].id}, ${group.members[seed].id}, ${seed + 1})`;
          }
          for (const match of group.matches) {
            matchNumber += 1;
            await sql`
              INSERT INTO matches (tournament_id, bracket_id, stage_id, group_id, match_code, round_number, match_number, best_of, participant_one_registration_id, participant_two_registration_id, status)
              VALUES (${id}, ${bracketRows[0].id}, ${stageId}, ${groupRows[0].id}, ${match.key}, ${match.round}, ${matchNumber}, 1, ${registrationId(match.participantOne)}, ${registrationId(match.participantTwo)}, 'ready')
            `;
          }
        }
        return { phase: parsed.data.phase, groups: 4, matches: 24 };
      }

      const groupRows = await sql`
        SELECT g.id, g.name, gm.registration_id, gm.group_seed, COALESCE(t.name, u.nickname) AS team_name
        FROM tournament_groups g JOIN tournament_group_members gm ON gm.group_id = g.id
        JOIN tournament_registrations tr ON tr.id = gm.registration_id
        LEFT JOIN teams t ON t.id = tr.team_id LEFT JOIN users u ON u.id = tr.player_id
        WHERE g.tournament_id = ${id} ORDER BY g.group_order, gm.group_seed
      `;
      const groupMatches = await sql`
        SELECT group_id, participant_one_registration_id AS one_id, participant_two_registration_id AS two_id,
               participant_one_score AS one_score, participant_two_score AS two_score
        FROM matches WHERE tournament_id = ${id} AND group_id IS NOT NULL AND status = 'completed'
      `;
      if (groupMatches.length !== 24) throw new Error("GROUPS_INCOMPLETE");
      const standings: Record<string, ReturnType<typeof calculateStandings>> = {};
      for (const name of ["A", "B", "C", "D"]) {
        const members: TournamentSeed[] = groupRows.filter((row) => row.name === name).map((row) => ({ id: String(row.registration_id), name: String(row.team_name), seed: Number(row.group_seed) }));
        const ids = new Set(members.map((member) => member.id));
        const results: GroupResult[] = [];
        for (const match of groupMatches) {
          if (!ids.has(String(match.one_id))) continue;
          results.push({ registrationId: String(match.one_id), opponentRegistrationId: String(match.two_id), score: Number(match.one_score), opponentScore: Number(match.two_score) });
          results.push({ registrationId: String(match.two_id), opponentRegistrationId: String(match.one_id), score: Number(match.two_score), opponentScore: Number(match.one_score) });
        }
        standings[name] = calculateStandings(members, results);
      }
      const playoffStage = await sql`INSERT INTO tournament_stages (tournament_id, stage_type, name, stage_order, status, best_of) VALUES (${id}, 'playoff', 'Плей-оф', 3, 'ready', 3) RETURNING id`;
      const placementStage = await sql`INSERT INTO tournament_stages (tournament_id, stage_type, name, stage_order, status, best_of) VALUES (${id}, 'placement', 'Матчі за місця', 4, 'ready', 5) RETURNING id`;
      const playoffBracket = await sql`INSERT INTO brackets (tournament_id, name, bracket_stage, published) VALUES (${id}, 'Плей-оф', 'playoff', true) RETURNING id`;
      const placementBracket = await sql`INSERT INTO brackets (tournament_id, name, bracket_stage, published) VALUES (${id}, 'Місця 3–6', 'placement', true) RETURNING id`;
      const planned = createPlayoff(standings);
      const playoffMatches = planned.filter((match) => match.stage === "playoff");
      const placementMatches = planned.filter((match) => match.stage === "placement");
      await insertMatches(sql, id, playoffStage[0].id, playoffBracket[0].id, playoffMatches, planned);
      await insertMatches(sql, id, placementStage[0].id, placementBracket[0].id, placementMatches, planned);
      await linkAllMatches(sql, id, planned);
      return { phase: parsed.data.phase, matches: planned.length, prizePlaces: 6 };
    });
    return ok(result, 201);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const messages: Record<string, [string, number]> = {
      TOURNAMENT_NOT_FOUND: ["Турнір не знайдено", 404], STAGE_EXISTS: ["Цей етап уже створено", 409],
      INVALID_TEAM_COUNT: ["Для кваліфікації потрібно від 16 до 256 підтверджених команд", 409],
      QUALIFICATION_REQUIRED: ["Спочатку завершіть кваліфікацію", 409], GROUPS_INCOMPLETE: ["Спочатку завершіть усі 24 групові матчі", 409]
    };
    const known = messages[code];
    return fail(known?.[0] ?? code, known?.[1] ?? 500);
  }
}

async function insertMatches(sql: TransactionSql, tournamentId: string, stageId: string, bracketId: string, matches: PlannedMatch[], allMatches = matches) {
  const ids = new Map<string, string>();
  let number = 0;
  for (const match of matches) {
    number += 1;
    const rows = await sql`
      INSERT INTO matches (tournament_id, bracket_id, stage_id, match_code, round_number, match_number, best_of, participant_one_registration_id, participant_two_registration_id, status)
      VALUES (${tournamentId}, ${bracketId}, ${stageId}, ${match.key}, ${match.round}, ${number}, ${match.bestOf}, ${registrationId(match.participantOne)}, ${registrationId(match.participantTwo)}, 'ready') RETURNING id
    `;
    ids.set(match.key, String(rows[0].id));
  }
  if (allMatches === matches) await linkAllMatches(sql, tournamentId, matches);
  return ids.size;
}

async function linkAllMatches(sql: TransactionSql, tournamentId: string, matches: PlannedMatch[]) {
  const rows = await sql`SELECT id, match_code FROM matches WHERE tournament_id = ${tournamentId} AND match_code IS NOT NULL`;
  const ids = new Map(rows.map((row) => [String(row.match_code), String(row.id)]));
  for (const match of matches) {
    const sourceId = ids.get(match.key);
    if (!sourceId) continue;
    if (match.winnerTo) {
      const targetId = ids.get(match.winnerTo.matchKey);
      if (targetId) await sql`UPDATE matches SET next_match_id = ${targetId}, next_match_slot = ${match.winnerTo.slot} WHERE id = ${sourceId}`;
    }
    if (match.loserTo) {
      const targetId = ids.get(match.loserTo.matchKey);
      if (targetId) await sql`UPDATE matches SET loser_next_match_id = ${targetId}, loser_next_match_slot = ${match.loserTo.slot} WHERE id = ${sourceId}`;
    }
  }
}
