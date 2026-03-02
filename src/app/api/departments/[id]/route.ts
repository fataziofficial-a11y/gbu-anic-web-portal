import { auth } from "@/auth";
import { db } from "@/lib/db";
import { departments, teamMembers, projects, publications, knowledgeItems } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateDeptSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().max(255).optional(),
  description: z.string().optional().nullable(),
  headId: z.number().int().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

function parseId(raw: string) { const id = parseInt(raw); return isNaN(id) ? null : id; }

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);
    const item = await db.query.departments.findFirst({
      where: eq(departments.id, id),
      with: { head: true, teamMembers: true },
    });
    if (!item) return apiError("Подразделение не найдено", 404);
    return apiSuccess(item);
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    if (session.user.role !== "admin") return apiError("Доступ запрещён", 403);

    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const existing = await db.query.departments.findFirst({ where: eq(departments.id, id) });
    if (!existing) return apiError("Подразделение не найдено", 404);

    const body = await request.json();
    const parsed = updateDeptSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const updates: Partial<typeof departments.$inferInsert> = {};

    if (data.name !== undefined) { updates.name = data.name; if (!data.slug) updates.slug = generateSlug(data.name); }
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.description !== undefined) updates.description = data.description ?? undefined;
    if (data.headId !== undefined) updates.headId = data.headId ?? undefined;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

    const [updated] = await db.update(departments).set(updates).where(eq(departments.id, id)).returning();
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

    // Обнуляем FK-ссылки перед удалением
    await Promise.all([
      db.update(teamMembers).set({ departmentId: undefined }).where(eq(teamMembers.departmentId, id)),
      db.update(projects).set({ departmentId: undefined }).where(eq(projects.departmentId, id)),
      db.update(publications).set({ departmentId: undefined }).where(eq(publications.departmentId, id)),
      db.update(knowledgeItems).set({ departmentId: undefined }).where(eq(knowledgeItems.departmentId, id)),
    ]);
    await db.delete(departments).where(eq(departments.id, id));
    return apiSuccess({ deleted: true });
  });
}
