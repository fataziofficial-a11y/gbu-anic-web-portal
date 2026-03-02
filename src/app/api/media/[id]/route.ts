import { auth } from "@/auth";
import { db } from "@/lib/db";
import { mediaItems } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(["video", "photo"]).optional(),
  videoUrl: z.string().max(1000).optional().nullable(),
  thumbnailId: z.number().int().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["published", "draft"]).optional(),
});

function parseId(raw: string) { const id = parseInt(raw); return isNaN(id) ? null : id; }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const existing = await db.query.mediaItems.findFirst({ where: eq(mediaItems.id, id) });
    if (!existing) return apiError("Медиа не найдено", 404);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const updates: Partial<typeof mediaItems.$inferInsert> = {};

    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description ?? undefined;
    if (data.type !== undefined) updates.type = data.type;
    if (data.videoUrl !== undefined) updates.videoUrl = data.videoUrl ?? undefined;
    if (data.thumbnailId !== undefined) updates.thumbnailId = data.thumbnailId ?? undefined;
    if (data.eventDate !== undefined) updates.eventDate = data.eventDate ?? undefined;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;
    if (data.status !== undefined) updates.status = data.status;

    const [updated] = await db.update(mediaItems).set(updates).where(eq(mediaItems.id, id)).returning();
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

    await db.delete(mediaItems).where(eq(mediaItems.id, id));
    return apiSuccess({ deleted: true });
  });
}
