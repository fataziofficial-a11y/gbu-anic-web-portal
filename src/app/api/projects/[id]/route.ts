import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateProjectSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().max(500).optional(),
  description: z.string().optional().nullable(),
  departmentId: z.number().int().optional().nullable(),
  status: z.enum(["active", "completed", "planned"]).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

function parseId(raw: string) { const id = parseInt(raw); return isNaN(id) ? null : id; }

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);
    const item = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: { department: true },
    });
    if (!item) return apiError("Проект не найден", 404);
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

    const existing = await db.query.projects.findFirst({ where: eq(projects.id, id) });
    if (!existing) return apiError("Проект не найден", 404);

    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const updates: Partial<typeof projects.$inferInsert> = {};

    if (data.title !== undefined) { updates.title = data.title; if (!data.slug) updates.slug = generateSlug(data.title); }
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.description !== undefined) updates.description = data.description ?? undefined;
    if (data.departmentId !== undefined) updates.departmentId = data.departmentId ?? undefined;
    if (data.status !== undefined) updates.status = data.status;
    if (data.startDate !== undefined) updates.startDate = data.startDate ?? undefined;
    if (data.endDate !== undefined) updates.endDate = data.endDate ?? undefined;

    const [updated] = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();
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

    await db.delete(projects).where(eq(projects.id, id));
    return apiSuccess({ deleted: true });
  });
}
