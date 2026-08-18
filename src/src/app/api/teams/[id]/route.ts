import { fail, ok, validationDetails } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { db, ensureTeamRosterSchema, hasDatabase } from "@/lib/db";
import { teamCreateSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const user = await getSession();
  if (!user) return fail("Увійдіть, щоб змінити склад команди", 401);
  if (!hasDatabase()) return fail("Редагування команд буде доступне після підключення PostgreSQL", 503);

  const parsed = teamCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Перевірте дані команди та складу", 422, validationDetails(parsed.error));
  const { id } = await context.params;
  const input = parsed.data;

  try {
    await ensureTeamRosterSchema();
    const team = await db().begin(async (sql) => {
      const owned = await sql`SELECT id FROM teams WHERE id = ${id} AND captain_id = ${user.id} AND active FOR UPDATE`;
      if (!owned.length) throw new Error("TEAM_NOT_OWNED");

      const rows = await sql`
        UPDATE teams
        SET name = ${input.name}, tag = ${input.tag.toUpperCase()}, description = ${input.description || null}, updated_at = now()
        WHERE id = ${id}
        RETURNING id, name, tag, slug, description, verified
      `;
      await sql`
        INSERT INTO user_profiles (user_id, telegram)
        VALUES (${user.id}, ${input.captainTelegram})
        ON CONFLICT (user_id)
        DO UPDATE SET telegram = excluded.telegram, updated_at = now()
      `;
      await sql`DELETE FROM team_roster_members WHERE team_id = ${id}`;
      for (const [index, player] of input.roster.entries()) {
        await sql`
          INSERT INTO team_roster_members
            (team_id, nickname, mlbb_id, mlbb_server, game_role, roster_role, sort_order, created_by)
          VALUES (
            ${id}, ${player.nickname}, ${player.mlbbId}, ${player.mlbbServer}, ${player.role},
            ${player.role === "Substitute" ? "substitute" : "starter"}, ${index + 1}, ${user.id}
          )
        `;
      }
      await sql`
        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
        VALUES (${user.id}, 'team.roster.update', 'team', ${id}, ${sql.json({ rosterSize: input.roster.length })})
      `;
      return {
        id: String(rows[0].id),
        name: String(rows[0].name),
        tag: String(rows[0].tag),
        description: input.description,
        captainTelegram: input.captainTelegram,
        roster: input.roster
      };
    });
    return ok({ team });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "TEAM_NOT_OWNED") return fail("Змінювати склад може тільки капітан команди", 403);
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return fail("Назва, тег або MLBB ID вже використовується", 409);
    }
    console.error("team_update_failed", error);
    return fail("Не вдалося оновити команду", 500);
  }
}
