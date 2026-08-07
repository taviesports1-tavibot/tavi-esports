import { fail, ok, validationDetails } from "@/lib/api";
import { getSession, isAdmin } from "@/lib/auth";
import { db, hasDatabase } from "@/lib/db";
import { matchUpdateSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const user = await getSession();
  if (!isAdmin(user)) return fail("Недостатньо прав", 403);
  if (!hasDatabase()) return fail("PostgreSQL не підключено", 503);
  const parsed = matchUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Перевірте рахунок", 422, validationDetails(parsed.error));
  const { id } = await context.params;

  try {
    const match = await db().begin(async (sql) => {
      const rows = await sql`
        SELECT m.*, ts.stage_type FROM matches m LEFT JOIN tournament_stages ts ON ts.id = m.stage_id
        WHERE m.id = ${id} FOR UPDATE
      `;
      if (!rows.length) throw new Error("MATCH_NOT_FOUND");
      const current = rows[0];
      if (!current.participant_one_registration_id || !current.participant_two_registration_id) throw new Error("PARTICIPANTS_MISSING");
      let winnerId: string | null = null;
      let status = current.status;
      if (parsed.data.complete) {
        const winsRequired = Math.floor(Number(current.best_of) / 2) + 1;
        const high = Math.max(parsed.data.scoreOne, parsed.data.scoreTwo);
        if (parsed.data.scoreOne === parsed.data.scoreTwo || high !== winsRequired) throw new Error("INVALID_FINAL_SCORE");
        winnerId = parsed.data.scoreOne > parsed.data.scoreTwo ? current.participant_one_registration_id : current.participant_two_registration_id;
        status = "completed";
      }
      const updated = await sql`
        UPDATE matches SET participant_one_score = ${parsed.data.scoreOne}, participant_two_score = ${parsed.data.scoreTwo},
          scheduled_at = COALESCE(${parsed.data.scheduledAt ?? null}, scheduled_at), status = ${status},
          winner_registration_id = ${winnerId}, completed_at = CASE WHEN ${parsed.data.complete} THEN now() ELSE completed_at END,
          updated_at = now() WHERE id = ${id} RETURNING *
      `;
      if (parsed.data.complete && current.stage_type === "qualification" && !current.next_match_id) {
        const orderRows = await sql`SELECT COALESCE(max(advancement_order), 0)::int + 1 AS next_order FROM tournament_stage_advancements WHERE stage_id = ${current.stage_id}`;
        await sql`
          INSERT INTO tournament_stage_advancements (stage_id, registration_id, advancement_order, source_match_id)
          VALUES (${current.stage_id}, ${winnerId}, ${orderRows[0].next_order}, ${id}) ON CONFLICT DO NOTHING
        `;
        const countRows = await sql`SELECT count(*)::int AS count FROM tournament_stage_advancements WHERE stage_id = ${current.stage_id}`;
        if (Number(countRows[0].count) === 16) await sql`UPDATE tournament_stages SET status = 'completed', updated_at = now() WHERE id = ${current.stage_id}`;
      }
      await sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data) VALUES (${user!.id}, 'tournament.match.update', 'match', ${id}, ${sql.json({ scoreOne: parsed.data.scoreOne, scoreTwo: parsed.data.scoreTwo, status })})`;
      return updated[0];
    });
    return ok({ match });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const messages: Record<string, [string, number]> = {
      MATCH_NOT_FOUND: ["Матч не знайдено", 404], PARTICIPANTS_MISSING: ["Учасники цього матчу ще не визначені", 409],
      INVALID_FINAL_SCORE: ["Фінальний рахунок не відповідає формату BO", 422]
    };
    const known = messages[code];
    return fail(known?.[0] ?? "Не вдалося оновити матч", known?.[1] ?? 500);
  }
}
