import { compare } from "bcryptjs";
import { createSession } from "@/lib/auth";
import { fail, ok, validationDetails } from "@/lib/api";
import { db, hasDatabase } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return fail("Вхід тимчасово недоступний: база даних ще не підключена", 503);
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Перевірте введені дані", 422, validationDetails(parsed.error));

  const rows = await db()`
    SELECT id, email, nickname, role, password_hash, status
    FROM users
    WHERE email = ${parsed.data.email}
    LIMIT 1
  `;
  const user = rows[0];

  if (!user || !(await compare(parsed.data.password, String(user.password_hash)))) {
    return fail("Неправильний email або пароль", 401);
  }
  if (user.status !== "active") return fail("Профіль заблоковано. Зверніться до підтримки", 403);

  await createSession({
    id: String(user.id),
    email: String(user.email),
    nickname: String(user.nickname),
    role: user.role
  });

  await db()`UPDATE users SET last_login_at = now() WHERE id = ${user.id}`;
  return ok({ user: { id: user.id, nickname: user.nickname, role: user.role } });
}

