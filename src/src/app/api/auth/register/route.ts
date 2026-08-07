import { hash } from "bcryptjs";
import { createSession } from "@/lib/auth";
import { fail, ok, validationDetails } from "@/lib/api";
import { db, hasDatabase } from "@/lib/db";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return fail("Реєстрація тимчасово недоступна: база даних ще не підключена", 503);
  }

  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Перевірте введені дані", 422, validationDetails(parsed.error));

  const sql = db();
  const passwordHash = await hash(parsed.data.password, 12);

  try {
    const rows = await sql.begin(async (transaction) => {
      const created = await transaction`
        INSERT INTO users (email, nickname, password_hash)
        VALUES (${parsed.data.email}, ${parsed.data.nickname}, ${passwordHash})
        RETURNING id, email, nickname, role
      `;
      const user = created[0];
      await transaction`INSERT INTO user_profiles (user_id) VALUES (${user.id})`;
      await transaction`INSERT INTO user_wallets (user_id) VALUES (${user.id})`;
      return created;
    });

    const user = rows[0];
    await createSession({
      id: String(user.id),
      email: String(user.email),
      nickname: String(user.nickname),
      role: user.role
    });
    return ok({ user: { id: user.id, nickname: user.nickname, role: user.role } }, 201);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return fail("Email або нікнейм уже використовується", 409);
    }
    console.error("registration_failed", error);
    return fail("Не вдалося створити профіль", 500);
  }
}

