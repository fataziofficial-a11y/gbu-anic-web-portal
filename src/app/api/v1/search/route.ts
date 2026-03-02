/**
 * GET /api/v1/search?q=&type=
 * Публичный API — полнотекстовый поиск по контенту портала
 *
 * Query params:
 *   q     — поисковый запрос (обязательный, мин. 2 символа)
 *   type  — фильтр: news | knowledge | pages (по умолчанию все)
 *   limit — макс. результатов (default 20, max 50)
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { news, knowledgeItems, pages } from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { validateApiKey, V1_HEADERS } from "@/lib/utils/api-key";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: V1_HEADERS });
}

export async function GET(req: NextRequest) {
  const deny = validateApiKey(req);
  if (deny) return deny;

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const type = sp.get("type") ?? "";
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit") ?? "20")));

  if (q.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400, headers: V1_HEADERS }
    );
  }

  const pattern = `%${q}%`;
  const results: Array<{
    type: string;
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
  }> = [];

  const perType = Math.ceil(limit / (type ? 1 : 3));

  if (!type || type === "news") {
    const newsItems = await db.query.news.findMany({
      where: and(eq(news.status, "published"), ilike(news.title, pattern)),
      limit: perType,
      columns: { id: true, title: true, slug: true, excerpt: true },
    });
    results.push(...newsItems.map((n) => ({ type: "news", ...n })));
  }

  if (!type || type === "knowledge") {
    const kbItems = await db.query.knowledgeItems.findMany({
      where: and(eq(knowledgeItems.status, "published"), ilike(knowledgeItems.title, pattern)),
      limit: perType,
      columns: { id: true, title: true, slug: true },
    });
    results.push(...kbItems.map((k) => ({ type: "knowledge", ...k, excerpt: null })));
  }

  if (!type || type === "pages") {
    const pageItems = await db.query.pages.findMany({
      where: and(eq(pages.status, "published"), ilike(pages.title, pattern)),
      limit: perType,
      columns: { id: true, title: true, slug: true },
    });
    results.push(...pageItems.map((p) => ({ type: "page", ...p, excerpt: null })));
  }

  return NextResponse.json(
    { data: results.slice(0, limit), meta: { q, count: results.length } },
    { headers: V1_HEADERS }
  );
}
