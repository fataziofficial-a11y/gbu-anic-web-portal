import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(1000).optional(),
  docType: z.enum(["normative", "order", "regulation", "other"]).optional(),
  fileId: z.number().int().optional().nullable(),
  fileUrl: z.string().max(1000).optional().nullable(),
  issuedAt: z.string().optional().nullable(),
  status: z.enum(["active", "archived"]).optional(),
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

    const existing = await db.query.documents.findFirst({ where: eq(documents.id, id) });
    if (!existing) return apiError("Документ не найден", 404);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const updates: Partial<typeof documents.$inferInsert> = {};

    if (data.title !== undefined) updates.title = data.title;
    if (data.docType !== undefined) updates.docType = data.docType;
    if (data.fileId !== undefined) updates.fileId = data.fileId ?? undefined;
    if (data.fileUrl !== undefined) updates.fileUrl = data.fileUrl ?? undefined;
    if (data.issuedAt !== undefined) updates.issuedAt = data.issuedAt ?? undefined;
    if (data.status !== undefined) updates.status = data.status;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

    const [updated] = await db.update(documents).set(updates).where(eq(documents.id, id)).returning();
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

    await db.delete(documents).where(eq(documents.id, id));
    return apiSuccess({ deleted: true });
  });
}
