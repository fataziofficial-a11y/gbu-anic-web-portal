import { auth } from "@/auth";
import { db } from "@/lib/db";
import { newsCategories } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq } from "drizzle-orm";
import { z } from "zod";

// PATCH /api/news-categories/[id] — переименовать
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id } = await params;
    const body = await request.json();
    const parsed = z.object({ name: z.string().min(1).max(100) }).safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const [updated] = await db.update(newsCategories)
      .set({ name: parsed.data.name })
      .where(eq(newsCategories.id, parseInt(id)))
      .returning();

    if (!updated) return apiError("Категория не найдена", 404);
    return apiSuccess(updated);
  });
}

// DELETE /api/news-categories/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id } = await params;
    await db.delete(newsCategories).where(eq(newsCategories.id, parseInt(id)));
    return apiSuccess({ ok: true });
  });
}
