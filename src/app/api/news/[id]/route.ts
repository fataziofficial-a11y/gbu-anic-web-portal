import { auth } from "@/auth";
import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { upsertDoc, deleteDoc, newsDoc } from "@/lib/search/meili";

const updateNewsSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.any().optional(),
  excerpt: z.string().max(1000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  coverImageId: z.number().int().optional().nullable(),
  seoTitle: z.string().max(500).optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  slug: z.string().max(500).optional(),
});

function parseId(raw: string) {
  const id = parseInt(raw);
  return isNaN(id) ? null : id;
}

// GET /api/news/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const item = await db.query.news.findFirst({
      where: eq(news.id, id),
      with: { author: true, coverImage: true },
    });

    if (!item) return apiError("Новость не найдена", 404);

    return apiSuccess(item);
  });
}

// PATCH /api/news/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const existing = await db.query.news.findFirst({
      where: eq(news.id, id),
    });
    if (!existing) return apiError("Новость не найдена", 404);

    // Только admin/editor может редактировать чужие материалы
    const isOwner = existing.authorId === parseInt(session.user.id);
    const isPrivileged = ["admin", "editor"].includes(session.user.role);
    if (!isOwner && !isPrivileged) {
      return apiError("Доступ запрещён", 403);
    }

    const body = await request.json();
    const parsed = updateNewsSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 422);
    }

    const data = parsed.data;
    const updates: Partial<typeof news.$inferInsert> = { updatedAt: new Date() };

    if (data.title !== undefined) {
      updates.title = data.title;
      if (!data.slug) updates.slug = generateSlug(data.title);
    }
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.content !== undefined) updates.content = data.content;
    if (data.excerpt !== undefined) updates.excerpt = data.excerpt ?? undefined;
    if (data.category !== undefined) updates.category = data.category ?? undefined;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.coverImageId !== undefined) updates.coverImageId = data.coverImageId ?? undefined;
    if (data.seoTitle !== undefined) updates.seoTitle = data.seoTitle ?? undefined;
    if (data.seoDescription !== undefined) updates.seoDescription = data.seoDescription ?? undefined;

    if (data.status !== undefined) {
      updates.status = data.status;
      if (data.status === "published" && !existing.publishedAt) {
        updates.publishedAt = new Date();
      }
    }

    const [updated] = await db
      .update(news)
      .set(updates)
      .where(eq(news.id, id))
      .returning();

    if (updated.status === "published") {
      void upsertDoc(newsDoc(updated));
    } else {
      void deleteDoc(`news_${updated.id}`);
    }

    return apiSuccess(updated);
  });
}

// DELETE /api/news/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const existing = await db.query.news.findFirst({
      where: eq(news.id, id),
    });
    if (!existing) return apiError("Новость не найдена", 404);

    const isOwner = existing.authorId === parseInt(session.user.id);
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return apiError("Доступ запрещён", 403);
    }

    await db.delete(news).where(eq(news.id, id));
    void deleteDoc(`news_${id}`);

    return apiSuccess({ deleted: true });
  });
}
