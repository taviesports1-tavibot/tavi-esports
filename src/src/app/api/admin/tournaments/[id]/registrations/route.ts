import { fail, ok } from "@/lib/api";
import { getSession, isAdmin } from "@/lib/auth";
import { db, hasDatabase } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const user = await getSession();
  if (!isAdmin(user)) return fail("Недостатньо прав", 403);
  if (!hasDatabase()) return ok({ registrations: [], source: "demo" });
  const { id } = await context.params;
  const registrations = await db()`
    SELECT tr.id, tr.status, tr.seed, tr.roster_snapshot, tr.admin_note, tr.created_at,
           t.name AS team_name, t.tag, u.nickname AS captain_nickname, up.telegram
    FROM tournament_registrations tr
    JOIN teams t ON t.id = tr.team_id
    JOIN users u ON u.id = tr.captain_id
    LEFT JOIN user_profiles up ON up.user_id = tr.captain_id
    WHERE tr.tournament_id = ${id}
    ORDER BY CASE tr.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, tr.created_at
  `;
  return ok({ registrations, source: "database" });
}
