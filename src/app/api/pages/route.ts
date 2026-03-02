import { auth } from "@/auth";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { desc, eq, count } from "drizzle-orm";
import { z } from "zod";

const createPageSchema = z.object({
  title: z.string().min(1, "Заголовок обязателен").max(500),
  content: z.any().optional(),
  parentId: z.number().int().optional().nullable(),
  sortOrder: z.number().int().default(0),
  template: z.enum(["default", "about", "contacts"]).default("default"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  seoTitle: z.string().max(500).optional(),
  seoDescription: z.string().optional(),
  slug: z.string().max(500).optional(),
});

export async function GET() {
  return withErrorHandler(async () => {
    const items = await db.query.pages.findMany({
      orderBy: [desc(pages.sortOrder), desc(pages.createdAt)],
      with: { author: true },
    });
    const total = await db.select({ count: count() }).from(pages);
    return apiSuccess({ items, total: total[0].count });
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const body = await request.json();
    const parsed = createPageSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const slug = data.slug ?? generateSlug(data.title);

    const existing = await db.query.pages.findFirst({ where: eq(pages.slug, slug) });
    if (existing) return apiError("Страница с таким slug уже существует", 409);

    const [created] = await db.insert(pages).values({
      title: data.title,
      slug,
      content: data.content,
      parentId: data.parentId ?? undefined,
      sortOrder: data.sortOrder,
      template: data.template,
      status: data.status,
      authorId: parseInt(session.user.id),
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
    }).returning();

    return apiSuccess(created, 201);
  });
}
