import { getSession } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  return user ? ok({ user }) : fail("Потрібна авторизація", 401);
}

