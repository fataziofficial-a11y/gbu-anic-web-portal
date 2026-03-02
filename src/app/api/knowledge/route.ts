import { auth } from "@/auth";
import { db } from "@/lib/db";
import { knowledgeItems } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { desc, eq, count, ilike, and, SQL } from "drizzle-orm";
import { z } from "zod";
import { upsertDoc, knowledgeDoc } from "@/lib/search/meili";

const createKbSchema = z.object({
  title: z.string().min(1, "Заголовок обязателен").max(500),
  content: z.any().optional(),
  categoryId: z.number().int().optional().nullable(),
  tags: z.array(z.string()).optional(),
  departmentId: z.number().int().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  metadata: z.record(z.string(), z.any()).optional(),
  slug: z.string().max(500).optional(),
});

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "15"));
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";
    const categoryId = searchParams.get("categoryId") ?? "";

    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (status && ["draft", "published", "archived"].includes(status)) {
      conditions.push(eq(knowledgeItems.status, status));
    }
    if (categoryId) {
      conditions.push(eq(knowledgeItems.categoryId, parseInt(categoryId)));
    }
    if (search) {
      conditions.push(ilike(knowledgeItems.title, `%${search}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db.query.knowledgeItems.findMany({
        where,
        orderBy: [desc(knowledgeItems.createdAt)],
        limit,
        offset,
        with: { author: true, category: true },
      }),
      db.select({ count: count() }).from(knowledgeItems).where(where),
    ]);

    return apiSuccess({
      items,
      total: totalResult[0].count,
      page,
      limit,
      totalPages: Math.ceil(Number(totalResult[0].count) / limit),
    });
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const body = await request.json();
    const parsed = createKbSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const slug = data.slug ?? generateSlug(data.title);

    const existing = await db.query.knowledgeItems.findFirst({
      where: eq(knowledgeItems.slug, slug),
    });
    if (existing) return apiError("Материал с таким slug уже существует", 409);

    const [created] = await db.insert(knowledgeItems).values({
      title: data.title,
      slug,
      content: data.content,
      categoryId: data.categoryId ?? undefined,
      tags: data.tags ?? [],
      departmentId: data.departmentId ?? undefined,
      authorId: parseInt(session.user.id),
      status: data.status,
      publishedAt: data.status === "published" ? new Date() : undefined,
      metadata: data.metadata ?? {},
    }).returning();

    if (created.status === "published") {
      void upsertDoc(knowledgeDoc(created));
    }

    return apiSuccess(created, 201);
  });
}
