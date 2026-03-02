/**
 * GET /api/v1/knowledge
 * Публичный API — список опубликованных материалов БЗ
 *
 * Query params:
 *   q          — поиск по заголовку (ilike)
 *   category   — slug категории
 *   department — id подразделения
 *   limit      — макс. количество (default 20, max 100)
 *   offset     — смещение (default 0)
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeItems, kbCategories } from "@/lib/db/schema";
import { eq, and, ilike, SQL, desc } from "drizzle-orm";
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
  const categorySlug = sp.get("category") ?? "";
  const departmentId = sp.get("department") ? Number(sp.get("department")) : null;
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? "20")));
  const offset = Math.max(0, Number(sp.get("offset") ?? "0"));

  const conditions: SQL[] = [eq(knowledgeItems.status, "published")];

  if (q) conditions.push(ilike(knowledgeItems.title, `%${q}%`));
  if (departmentId) conditions.push(eq(knowledgeItems.departmentId, departmentId));

  if (categorySlug) {
    const cat = await db.query.kbCategories.findFirst({
      where: eq(kbCategories.slug, categorySlug),
      columns: { id: true },
    });
    if (cat) conditions.push(eq(knowledgeItems.categoryId, cat.id));
  }

  const items = await db.query.knowledgeItems.findMany({
    where: and(...conditions),
    orderBy: [desc(knowledgeItems.publishedAt)],
    limit,
    offset,
    columns: {
      id: true,
      title: true,
      slug: true,
      tags: true,
      publishedAt: true,
      categoryId: true,
      departmentId: true,
    },
    with: {
      category: { columns: { name: true, slug: true } },
      department: { columns: { name: true } },
    },
  });

  return NextResponse.json(
    { data: items, meta: { limit, offset, count: items.length } },
    { headers: V1_HEADERS }
  );
}
