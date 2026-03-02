import { auth } from "@/auth";
import { db } from "@/lib/db";
import { procurements } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(1000).optional(),
  description: z.string().optional().nullable(),
  eisUrl: z.string().max(1000).optional().nullable(),
  publishedAt: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  amount: z.string().max(255).optional().nullable(),
  status: z.enum(["open", "closed", "cancelled"]).optional(),
});

function parseId(raw: string) { const id = parseInt(raw); return isNaN(id) ? null : id; }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const existing = await db.query.procurements.findFirst({ where: eq(procurements.id, id) });
    if (!existing) return apiError("Закупка не найдена", 404);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const updates: Partial<typeof procurements.$inferInsert> = {};

    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description ?? undefined;
    if (data.eisUrl !== undefined) updates.eisUrl = data.eisUrl ?? undefined;
    if (data.publishedAt !== undefined) updates.publishedAt = data.publishedAt ?? undefined;
    if (data.deadline !== undefined) updates.deadline = data.deadline ?? undefined;
    if (data.amount !== undefined) updates.amount = data.amount ?? undefined;
    if (data.status !== undefined) updates.status = data.status;

    const [updated] = await db.update(procurements).set(updates).where(eq(procurements.id, id)).returning();
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

    await db.delete(procurements).where(eq(procurements.id, id));
    return apiSuccess({ deleted: true });
  });
}
