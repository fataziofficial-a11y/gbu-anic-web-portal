import { auth } from "@/auth";
import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq } from "drizzle-orm";

// POST /api/news/[id]/publish — публикация / снятие с публикации
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    if (!["admin", "editor"].includes(session.user.role)) {
      return apiError("Доступ запрещён", 403);
    }

    const { id: rawId } = await params;
    const id = parseInt(rawId);
    if (isNaN(id)) return apiError("Неверный ID", 400);

    const item = await db.query.news.findFirst({
      where: eq(news.id, id),
    });
    if (!item) return apiError("Новость не найдена", 404);

    const isPublished = item.status === "published";
    const [updated] = await db
      .update(news)
      .set({
        status: isPublished ? "draft" : "published",
        publishedAt: isPublished ? item.publishedAt : (item.publishedAt ?? new Date()),
        updatedAt: new Date(),
      })
      .where(eq(news.id, id))
      .returning();

    return apiSuccess(updated);
  });
}
