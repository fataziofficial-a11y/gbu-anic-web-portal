import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { count } from "drizzle-orm";

export async function GET() {
  const start = Date.now();
  try {
    await db.select({ count: count() }).from(news);
    const ms = Date.now() - start;
    return Response.json({
      status: "ok",
      db: "connected",
      latencyMs: ms,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      {
        status: "error",
        db: "disconnected",
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
