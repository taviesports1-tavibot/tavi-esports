import { fail, ok, validationDetails } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { db, hasDatabase } from "@/lib/db";
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

      const slugBase = input.teamName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "team";
      const suffix = user.id.slice(0, 6);
      const existingTeams = await sql`SELECT id FROM teams WHERE captain_id = ${user.id} AND lower(name::text) = lower(${input.teamName}) AND active LIMIT 1`;
      const teams = existingTeams.length ? existingTeams : await sql`
        INSERT INTO teams (name, tag, slug, captain_id)
        VALUES (${input.teamName}, ${input.tag.toUpperCase()}, ${`${slugBase}-${suffix}`}, ${user.id}) RETURNING id
      `;
      const teamId = teams[0].id;
      await sql`
        INSERT INTO user_profiles (user_id, telegram)
        VALUES (${user.id}, ${input.captainTelegram})
        ON CONFLICT (user_id) DO UPDATE SET telegram = excluded.telegram, updated_at = now()
      `;
      const rows = await sql`
        INSERT INTO tournament_registrations (tournament_id, team_id, captain_id, roster_snapshot)
        VALUES (${tournament.id}, ${teamId}, ${user.id}, ${sql.json(input.roster)})
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
    if (message.includes("duplicate key")) return fail("Назва або тег команди вже зайняті", 409);
    return fail("Не вдалося зберегти заявку", 500);
  }
}
