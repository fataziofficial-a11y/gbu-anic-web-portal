import { db } from "@/lib/db";
import { news, knowledgeItems, pages } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq, ilike, and } from "drizzle-orm";
import { searchContent } from "@/lib/search/meili";

type SearchResult = {
  type: string;
  id: number;
  title: string;
  slug?: string;
  excerpt?: string | null;
};

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const type = searchParams.get("type") ?? "all"; // all | news | knowledge | pages

    if (!q || q.length < 2) return apiError("Запрос слишком короткий (минимум 2 символа)", 400);

    // ── Meilisearch (если настроен) ─────────────────────────────────────────
    const meiliType =
      type === "news" ? ("news" as const) :
      type === "knowledge" ? ("knowledge" as const) :
      type === "pages" ? ("page" as const) :
      undefined;

    const meiliHits = await searchContent(q, { type: meiliType, limit: 15 });

    if (meiliHits !== null) {
      const results: SearchResult[] = meiliHits.map((h) => ({
        type: h.type,
        id: h.numericId,
        title: h.title,
        slug: h.slug,
        excerpt: h.body || null,
      }));
      return apiSuccess({ results, query: q, total: results.length, source: "meili" });
    }

    // ── Fallback: DB ilike ───────────────────────────────────────────────────
    const pattern = `%${q}%`;
    const results: SearchResult[] = [];

    if (type === "all" || type === "news") {
      const items = await db.query.news.findMany({
        where: and(eq(news.status, "published"), ilike(news.title, pattern)),
        columns: { id: true, title: true, slug: true, excerpt: true },
        limit: 5,
      });
      results.push(...items.map((i) => ({ type: "news", ...i })));
    }

    if (type === "all" || type === "knowledge") {
      const items = await db.query.knowledgeItems.findMany({
        where: and(eq(knowledgeItems.status, "published"), ilike(knowledgeItems.title, pattern)),
        columns: { id: true, title: true, slug: true },
        limit: 5,
      });
      results.push(...items.map((i) => ({ type: "knowledge", ...i })));
    }

    if (type === "all" || type === "pages") {
      const items = await db.query.pages.findMany({
        where: and(eq(pages.status, "published"), ilike(pages.title, pattern)),
        columns: { id: true, title: true, slug: true },
        limit: 5,
      });
      results.push(...items.map((i) => ({ type: "page", ...i })));
    }

    return apiSuccess({ results, query: q, total: results.length, source: "db" });
  });
}
