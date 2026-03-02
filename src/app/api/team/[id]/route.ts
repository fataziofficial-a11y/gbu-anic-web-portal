import { auth } from "@/auth";
import { db } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateTeamSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  position: z.string().max(255).optional().nullable(),
  departmentId: z.number().int().optional().nullable(),
  photoId: z.number().int().optional().nullable(),
  bio: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  sortOrder: z.number().int().optional(),
});

function parseId(raw: string) { const id = parseInt(raw); return isNaN(id) ? null : id; }

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);
    const item = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, id),
      with: { department: true, photo: true },
    });
    if (!item) return apiError("Сотрудник не найден", 404);
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

    const existing = await db.query.teamMembers.findFirst({ where: eq(teamMembers.id, id) });
    if (!existing) return apiError("Сотрудник не найден", 404);

    const body = await request.json();
    const parsed = updateTeamSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const updates: Partial<typeof teamMembers.$inferInsert> = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.position !== undefined) updates.position = data.position ?? undefined;
    if (data.departmentId !== undefined) updates.departmentId = data.departmentId ?? undefined;
    if (data.photoId !== undefined) updates.photoId = data.photoId ?? undefined;
    if (data.bio !== undefined) updates.bio = data.bio ?? undefined;
    if (data.email !== undefined) updates.email = data.email || undefined;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

    const [updated] = await db.update(teamMembers).set(updates).where(eq(teamMembers.id, id)).returning();
    return apiSuccess(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    if (session.user.role !== "admin") return apiError("Доступ запрещён", 403);

    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const existing = await db.query.teamMembers.findFirst({ where: eq(teamMembers.id, id) });
    if (!existing) return apiError("Сотрудник не найден", 404);

    await db.delete(teamMembers).where(eq(teamMembers.id, id));
    return apiSuccess({ deleted: true });
  });
}
