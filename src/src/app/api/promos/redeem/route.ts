import { getSession } from "@/lib/auth";
import { fail, ok, validationDetails } from "@/lib/api";
import { db, hasDatabase } from "@/lib/db";
import { promoRedeemSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return fail("Спочатку увійдіть до профілю", 401);
  if (!hasDatabase()) return fail("База даних ще не підключена", 503);

  const parsed = promoRedeemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Некоректний промокод", 422, validationDetails(parsed.error));

  try {
    const rows = await db()`SELECT * FROM redeem_promo(${user.id}::uuid, ${parsed.data.code})`;
    const reward = rows[0];
    const unit = reward.reward_type === "coins" ? "TaVi Coins" : "квитків";
    return ok({
      ...reward,
      message: `Успішно! Нараховано ${reward.reward_amount} ${unit}.`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Промокод не активовано";
    const safeMessage = message.includes("PROMO_")
      ? {
          PROMO_NOT_FOUND: "Промокод не знайдено",
          PROMO_INACTIVE: "Промокод неактивний",
          PROMO_NOT_STARTED: "Промокод ще не активний",
          PROMO_EXPIRED: "Термін дії промокоду завершився",
          PROMO_LIMIT_REACHED: "Ліміт використань промокоду вичерпано",
          PROMO_USER_LIMIT_REACHED: "Ви вже використали цей промокод"
        }[message.match(/PROMO_[A-Z_]+/)?.[0] || ""] || "Промокод не активовано"
      : "Промокод не активовано";
    return fail(safeMessage, 400);
  }
}

