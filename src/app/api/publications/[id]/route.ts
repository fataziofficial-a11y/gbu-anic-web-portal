import { auth } from "@/auth";
import { db } from "@/lib/db";
import { publications } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(1000).optional(),
  authors: z.string().optional().nullable(),
  abstract: z.string().optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  journal: z.string().max(500).optional().nullable(),
  doi: z.string().max(255).optional().nullable(),
  fileId: z.number().int().optional().nullable(),
  departmentId: z.number().int().optional().nullable(),
});

function parseId(raw: string) { const id = parseInt(raw); return isNaN(id) ? null : id; }

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);
    const item = await db.query.publications.findFirst({
      where: eq(publications.id, id),
      with: { department: true, file: true },
    });
    if (!item) return apiError("Публикация не найдена", 404);
    return apiSuccess(item);
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const existing = await db.query.publications.findFirst({ where: eq(publications.id, id) });
    if (!existing) return apiError("Публикация не найдена", 404);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const updates: Partial<typeof publications.$inferInsert> = {};

    if (data.title !== undefined) updates.title = data.title;
    if (data.authors !== undefined) updates.authors = data.authors ?? undefined;
    if (data.abstract !== undefined) updates.abstract = data.abstract ?? undefined;
    if (data.year !== undefined) updates.year = data.year ?? undefined;
    if (data.journal !== undefined) updates.journal = data.journal ?? undefined;
    if (data.doi !== undefined) updates.doi = data.doi ?? undefined;
    if (data.fileId !== undefined) updates.fileId = data.fileId ?? undefined;
    if (data.departmentId !== undefined) updates.departmentId = data.departmentId ?? undefined;

    const [updated] = await db.update(publications).set(updates).where(eq(publications.id, id)).returning();
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

    await db.delete(publications).where(eq(publications.id, id));
    return apiSuccess({ deleted: true });
  });
}
