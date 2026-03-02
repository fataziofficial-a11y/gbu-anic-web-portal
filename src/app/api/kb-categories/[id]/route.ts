import { auth } from "@/auth";
import { db } from "@/lib/db";
import { kbCategories, knowledgeItems } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

function parseId(raw: string) { const id = parseInt(raw); return isNaN(id) ? null : id; }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const existing = await db.query.kbCategories.findFirst({ where: eq(kbCategories.id, id) });
    if (!existing) return apiError("Категория не найдена", 404);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const updates: Partial<typeof kbCategories.$inferInsert> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description ?? undefined;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

    const [updated] = await db.update(kbCategories).set(updates).where(eq(kbCategories.id, id)).returning();
    return apiSuccess(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const existing = await db.query.kbCategories.findFirst({ where: eq(kbCategories.id, id) });
    if (!existing) return apiError("Категория не найдена", 404);

    // Обнуляем ссылки в статьях
    await db.update(knowledgeItems).set({ categoryId: undefined }).where(eq(knowledgeItems.categoryId, id));
    await db.delete(kbCategories).where(eq(kbCategories.id, id));
    return apiSuccess({ deleted: true });
  });
}
