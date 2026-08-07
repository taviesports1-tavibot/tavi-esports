import { fail, ok, validationDetails } from "@/lib/api";
import { getSession, isAdmin } from "@/lib/auth";
import { db, hasDatabase } from "@/lib/db";
import { registrationReviewSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string; registrationId: string }> };

export async function PATCH(request: Request, context: Context) {
  const user = await getSession();
  if (!isAdmin(user)) return fail("Недостатньо прав", 403);
  if (!hasDatabase()) return fail("PostgreSQL не підключено", 503);
  const parsed = registrationReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Некоректне рішення", 422, validationDetails(parsed.error));
  const { id, registrationId } = await context.params;
  const status = parsed.data.action === "approve" ? "approved" : "rejected";
  const rows = await db()`
    UPDATE tournament_registrations
    SET status = ${status}, admin_note = ${parsed.data.note ?? null}, seed = ${parsed.data.seed ?? null},
        reviewed_by = ${user!.id}, reviewed_at = now(), updated_at = now()
    WHERE id = ${registrationId} AND tournament_id = ${id} AND status = 'pending'
    RETURNING id, status, seed, admin_note
  `;
  if (!rows.length) return fail("Заявку не знайдено або її вже розглянуто", 409);
  await db()`
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
    VALUES (${user!.id}, 'tournament.registration.review', 'tournament_registration', ${registrationId}, ${db().json(rows[0])})
  `;
  return ok({ registration: rows[0] });
}
