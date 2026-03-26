import { auth } from "@/auth";
import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { desc, eq, ilike, or, count, and, SQL } from "drizzle-orm";
import { z } from "zod";
import { upsertDoc, newsDoc } from "@/lib/search/meili";

const createNewsSchema = z.object({
  title: z.string().min(1, "Заголовок обязателен").max(500),
  content: z.any().optional(),
  excerpt: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional().default("draft"),
  coverImageId: z.number().int().optional(),
  seoTitle: z.string().max(500).optional(),
  seoDescription: z.string().optional(),
  slug: z.string().max(500).optional(),
});

// GET /api/news — список новостей с пагинацией
export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10"));
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";

    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (status && ["draft", "published", "archived"].includes(status)) {
      conditions.push(eq(news.status, status));
    }
    if (search) {
      conditions.push(
        or(
          ilike(news.title, `%${search}%`),
          ilike(news.excerpt, `%${search}%`)
        )!
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db.query.news.findMany({
        where,
        orderBy: [desc(news.createdAt)],
        limit,
        offset,
        with: { author: true, coverImage: true },
      }),
      db.select({ count: count() }).from(news).where(where),
    ]);

    const total = totalResult[0].count;

    return apiSuccess({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    });
  });
}

// POST /api/news — создать новость
export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const body = await request.json();
    const parsed = createNewsSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 422);
    }

    const data = parsed.data;
    const slug = data.slug ?? generateSlug(data.title);

    // Проверяем уникальность slug
    const existing = await db.query.news.findFirst({
      where: eq(news.slug, slug),
    });
    if (existing) {
      return apiError("Новость с таким slug уже существует", 409);
    }

    const publishedAt =
      data.status === "published" ? new Date() : undefined;

    const [created] = await db
      .insert(news)
      .values({
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        category: data.category,
        tags: data.tags ?? [],
        status: data.status,
        coverImageId: data.coverImageId,
        authorId: parseInt(session.user.id),
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        publishedAt,
      })
      .returning();

    if (created.status === "published") {
      void upsertDoc(newsDoc(created));
    }

    return apiSuccess(created, 201);
  });
}
