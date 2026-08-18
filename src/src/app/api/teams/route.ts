import { fail, ok, validationDetails } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { db, ensureTeamRosterSchema, hasDatabase } from "@/lib/db";
import { teamCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return fail("Увійдіть, щоб створити команду", 401);
  if (!hasDatabase()) return fail("Створення команд буде доступне після підключення PostgreSQL", 503);

  const parsed = teamCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Перевірте дані команди та складу", 422, validationDetails(parsed.error));
  const input = parsed.data;

  try {
    await ensureTeamRosterSchema();
    const team = await db().begin(async (sql) => {
      const slugBase = input.name
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "team";
      const slug = `${slugBase}-${user.id.slice(0, 6)}-${Date.now().toString(36)}`;
      const rows = await sql`
        INSERT INTO teams (name, tag, slug, captain_id, description)
        VALUES (${input.name}, ${input.tag.toUpperCase()}, ${slug}, ${user.id}, ${input.description || null})
        RETURNING id, name, tag, slug, description, verified
      `;
      const created = rows[0];

      await sql`
        INSERT INTO team_members (team_id, user_id, role, status)
        VALUES (${created.id}, ${user.id}, 'captain', 'active')
        ON CONFLICT (team_id, user_id)
        DO UPDATE SET role = 'captain', status = 'active'
      `;
      await sql`
        INSERT INTO user_profiles (user_id, telegram)
        VALUES (${user.id}, ${input.captainTelegram})
        ON CONFLICT (user_id)
        DO UPDATE SET telegram = excluded.telegram, updated_at = now()
      `;

      for (const [index, player] of input.roster.entries()) {
        await sql`
          INSERT INTO team_roster_members
            (team_id, nickname, mlbb_id, mlbb_server, game_role, roster_role, sort_order, created_by)
          VALUES (
            ${created.id}, ${player.nickname}, ${player.mlbbId}, ${player.mlbbServer}, ${player.role},
            ${player.role === "Substitute" ? "substitute" : "starter"}, ${index + 1}, ${user.id}
          )
        `;
      }

      await sql`
        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
        VALUES (
          ${user.id}, 'team.create', 'team', ${created.id},
          ${sql.json({ name: input.name, tag: input.tag.toUpperCase(), rosterSize: input.roster.length })}
        )
      `;

      return {
        id: String(created.id),
        name: String(created.name),
        tag: String(created.tag),
        description: input.description,
        captainTelegram: input.captainTelegram,
        roster: input.roster
      };
    });

    return ok({ team }, 201);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return fail("Назва, тег або MLBB ID вже використовується в цій команді", 409);
    }
    console.error("team_create_failed", error);
    return fail("Не вдалося створити команду", 500);
  }
}
