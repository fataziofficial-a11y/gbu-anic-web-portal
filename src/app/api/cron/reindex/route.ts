import { NextRequest, NextResponse } from "next/server";
import { reindexAll } from "@/lib/search/reindex";
import { logger } from "@/lib/logger";

// Пересборка поискового индекса по расписанию (cron на сервере, каждые 10 мин).
// Доступ — по заголовку x-cron-secret = CRON_SECRET из .env.local.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const r = await reindexAll();
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    logger.error("Search reindex failed", { err: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
