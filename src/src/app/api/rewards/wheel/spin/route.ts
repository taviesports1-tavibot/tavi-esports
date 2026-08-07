import { getSession } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { db, hasDatabase } from "@/lib/db";

export async function POST() {
  const user = await getSession();
  if (!user) return fail("Спочатку увійдіть до профілю", 401);
  if (!hasDatabase()) return fail("База даних ще не підключена", 503);

  try {
    const rows = await db()`SELECT * FROM spin_wheel(${user.id}::uuid)`;
    return ok({ spin: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("NO_WHEEL_TICKETS")) return fail("У вас немає квитків Колеса Фортуни", 400);
    return fail("Не вдалося виконати обертання", 500);
  }
}

