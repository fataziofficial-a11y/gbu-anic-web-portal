import { auth } from "@/auth";
import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logoId: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  services: z.string().optional().nullable(),
  websiteUrl: z.string().max(1000).optional().nullable(),
  projectIds: z.array(z.number().int()).optional(),
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

    const existing = await db.query.partners.findFirst({ where: eq(partners.id, id) });
    if (!existing) return apiError("Партнёр не найден", 404);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const updates: Partial<typeof partners.$inferInsert> = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.logoId !== undefined) updates.logoId = data.logoId ?? undefined;
    if (data.description !== undefined) updates.description = data.description ?? undefined;
    if (data.services !== undefined) updates.services = data.services ?? undefined;
    if (data.websiteUrl !== undefined) updates.websiteUrl = data.websiteUrl ?? undefined;
    if (data.projectIds !== undefined) updates.projectIds = data.projectIds;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

    const [updated] = await db.update(partners).set(updates).where(eq(partners.id, id)).returning();
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

    await db.delete(partners).where(eq(partners.id, id));
    return apiSuccess({ deleted: true });
  });
}
