import { auth } from "@/auth";
import { db } from "@/lib/db";
import { knowledgeItems } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq } from "drizzle-orm";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    if (!["admin", "editor"].includes(session.user.role)) return apiError("Доступ запрещён", 403);

    const { id: rawId } = await params;
    const id = parseInt(rawId);
    if (isNaN(id)) return apiError("Неверный ID", 400);

    const item = await db.query.knowledgeItems.findFirst({ where: eq(knowledgeItems.id, id) });
    if (!item) return apiError("Материал не найден", 404);

    const isPublished = item.status === "published";
    const [updated] = await db.update(knowledgeItems).set({
      status: isPublished ? "draft" : "published",
      publishedAt: isPublished ? item.publishedAt : (item.publishedAt ?? new Date()),
      updatedAt: new Date(),
    }).where(eq(knowledgeItems.id, id)).returning();

    return apiSuccess(updated);
  });
}
