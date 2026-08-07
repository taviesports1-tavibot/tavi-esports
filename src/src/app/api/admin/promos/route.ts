import { getSession, isAdmin } from "@/lib/auth";
import { fail, ok, validationDetails } from "@/lib/api";
import { db, hasDatabase } from "@/lib/db";
import { promoCreateSchema } from "@/lib/validation";

export async function GET() {
  const user = await getSession();
  if (!isAdmin(user)) return fail("Недостатньо прав", 403);
  if (!hasDatabase()) return fail("База даних ще не підключена", 503);

  const promos = await db()`
    SELECT id, code, reward_type, reward_amount, max_uses, uses_count,
      max_uses_per_user, starts_at, expires_at, active, created_at
    FROM promo_codes
    ORDER BY created_at DESC
    LIMIT 100
  `;
  return ok({ promos });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!isAdmin(user)) return fail("Недостатньо прав", 403);
  if (!hasDatabase()) return fail("База даних ще не підключена", 503);

  const parsed = promoCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Перевірте дані промокоду", 422, validationDetails(parsed.error));
  if (new Date(parsed.data.expiresAt) <= new Date(parsed.data.startsAt)) {
    return fail("Дата завершення має бути пізніше дати початку", 422);
  }

  try {
    const rows = await db()`
      INSERT INTO promo_codes (
        code, reward_type, reward_amount, max_uses, max_uses_per_user,
        starts_at, expires_at, active, created_by
      )
      VALUES (
        ${parsed.data.code}, ${parsed.data.rewardType}, ${parsed.data.rewardAmount},
        ${parsed.data.maxUses}, ${parsed.data.maxUsesPerUser}, ${parsed.data.startsAt},
        ${parsed.data.expiresAt}, ${parsed.data.active}, ${user!.id}::uuid
      )
      RETURNING id, code, reward_type, reward_amount, max_uses, max_uses_per_user,
        starts_at, expires_at, active, created_at
    `;
    return ok({ promo: rows[0] }, 201);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return fail("Промокод із таким кодом уже існує", 409);
    }
    console.error("promo_create_failed", error);
    return fail("Не вдалося створити промокод", 500);
  }
}

