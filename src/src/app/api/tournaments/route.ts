import { ok } from "@/lib/api";
import { tournaments } from "@/lib/data";
import { db, hasDatabase } from "@/lib/db";

export async function GET() {
  if (!hasDatabase()) return ok({ tournaments, source: "demo" });

  const rows = await db()`
    SELECT
      t.id, t.slug, t.title, t.game, t.format, t.starts_at,
      t.registration_ends_at, t.prize_label, t.slots, t.status,
      count(tr.id)::int AS registered
    FROM tournaments t
    LEFT JOIN tournament_registrations tr
      ON tr.tournament_id = t.id AND tr.status = 'approved'
    WHERE t.visibility = 'public'
    GROUP BY t.id
    ORDER BY t.starts_at ASC
    LIMIT 50
  `;
  return ok({ tournaments: rows, source: "database" });
}

