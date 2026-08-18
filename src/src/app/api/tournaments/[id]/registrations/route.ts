import { fail, ok, validationDetails } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { db, ensureTeamRosterSchema, hasDatabase } from "@/lib/db";
import { tournamentRegistrationSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const user = await getSession();
  if (!user) return fail("Увійдіть, щоб подати командну заявку", 401);
  if (!hasDatabase()) return fail("Подача заявок буде доступна після підключення PostgreSQL", 503);

  const parsed = tournamentRegistrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Перевірте дані команди", 422, validationDetails(parsed.error));
  const { id } = await context.params;
  const input = parsed.data;

  try {
    await ensureTeamRosterSchema();
    const registration = await db().begin(async (sql) => {
      const tournaments = await sql`
        SELECT id, status, team_size, registration_ends_at
        FROM tournaments WHERE (id::text = ${id} OR slug = ${id}) AND visibility <> 'private'
        FOR UPDATE
      `;
      const tournament = tournaments[0];
      if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");
      if (tournament.status !== "registration" || new Date(tournament.registration_ends_at) <= new Date()) {
        throw new Error("REGISTRATION_CLOSED");
      }
      if (Number(tournament.team_size) !== 5) throw new Error("TEAM_FORMAT_UNSUPPORTED");

      const teams = await sql`
        SELECT id, name, tag FROM teams
        WHERE id = ${input.teamId} AND captain_id = ${user.id} AND active
        FOR UPDATE
      `;
      if (!teams.length) throw new Error("TEAM_NOT_OWNED");
      const teamId = teams[0].id;
      const rosterRows = await sql`
        SELECT nickname, mlbb_id, mlbb_server, game_role, roster_role, sort_order
        FROM team_roster_members
        WHERE team_id = ${teamId}
        ORDER BY sort_order
      `;
      if (rosterRows.length < 5 || rosterRows.length > 7) throw new Error("ROSTER_INCOMPLETE");
      const starters = rosterRows.filter((player) => player.roster_role === "starter");
      if (starters.length !== 5 || new Set(starters.map((player) => player.game_role)).size !== 5) {
        throw new Error("ROSTER_INCOMPLETE");
      }
      const roster = rosterRows.map((player) => ({
        nickname: String(player.nickname),
        mlbbId: String(player.mlbb_id),
        mlbbServer: String(player.mlbb_server),
        role: String(player.game_role)
      }));
      const rows = await sql`
        INSERT INTO tournament_registrations (tournament_id, team_id, captain_id, roster_snapshot)
        VALUES (${tournament.id}, ${teamId}, ${user.id}, ${sql.json(roster)})
        ON CONFLICT (tournament_id, team_id, player_id)
        DO UPDATE SET roster_snapshot = excluded.roster_snapshot, status = 'pending', admin_note = NULL, updated_at = now()
        RETURNING id, status, created_at
      `;
      await sql`
        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
        VALUES (${user.id}, 'tournament.registration.submit', 'tournament_registration', ${rows[0].id}, ${sql.json({ tournamentId: tournament.id, teamId })})
      `;
      return rows[0];
    });
    return ok({ registration }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "TOURNAMENT_NOT_FOUND") return fail("Турнір не знайдено", 404);
    if (message === "REGISTRATION_CLOSED") return fail("Реєстрацію вже закрито", 409);
    if (message === "TEAM_FORMAT_UNSUPPORTED") return fail("Для цього турніру потрібна індивідуальна заявка", 422);
    if (message === "TEAM_NOT_OWNED") return fail("Оберіть команду, у якій ви є капітаном", 403);
    if (message === "ROSTER_INCOMPLETE") return fail("У команді має бути 5 основних гравців з унікальними ролями та до 2 запасних", 422);
    return fail("Не вдалося зберегти заявку", 500);
  }
}
