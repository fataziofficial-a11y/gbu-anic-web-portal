import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectRubrics } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sortOrder: z.number().int().optional(),
});

function parseId(raw: string) {
  const id = parseInt(raw);
  return isNaN(id) ? null : id;
}

// PATCH /api/project-rubrics/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const updates: Partial<typeof projectRubrics.$inferInsert> = {};
    if (parsed.data.name !== undefined) {
      updates.name = parsed.data.name;
      updates.slug = generateSlug(parsed.data.name);
    }
    if (parsed.data.sortOrder !== undefined) updates.sortOrder = parsed.data.sortOrder;

    const [updated] = await db
      .update(projectRubrics)
      .set(updates)
      .where(eq(projectRubrics.id, id))
      .returning();

    if (!updated) return apiError("Рубрика не найдена", 404);

    return apiSuccess(updated);
  });
}

// DELETE /api/project-rubrics/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    await db.delete(projectRubrics).where(eq(projectRubrics.id, id));

    return apiSuccess({ deleted: true });
  });
}
