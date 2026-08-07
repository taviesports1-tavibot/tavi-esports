import { ok } from "@/lib/api";
import { hasDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({
    status: "online",
    version: "2.0.0",
    database: hasDatabase() ? "configured" : "demo",
    timestamp: new Date().toISOString()
  });
}

