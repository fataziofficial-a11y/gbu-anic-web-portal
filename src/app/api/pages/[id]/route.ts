import { auth } from "@/auth";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updatePageSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.any().optional(),
  parentId: z.number().int().optional().nullable(),
  sortOrder: z.number().int().optional(),
  template: z.enum(["default", "about", "contacts"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  seoTitle: z.string().max(500).optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  slug: z.string().max(500).optional(),
});

function parseId(raw: string) {
  const id = parseInt(raw);
  return isNaN(id) ? null : id;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const item = await db.query.pages.findFirst({
      where: eq(pages.id, id),
      with: { author: true },
    });
    if (!item) return apiError("Страница не найдена", 404);
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

    const existing = await db.query.pages.findFirst({ where: eq(pages.id, id) });
    if (!existing) return apiError("Страница не найдена", 404);

    const body = await request.json();
    const parsed = updatePageSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const updates: Partial<typeof pages.$inferInsert> = { updatedAt: new Date() };

    if (data.title !== undefined) { updates.title = data.title; if (!data.slug) updates.slug = generateSlug(data.title); }
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.content !== undefined) updates.content = data.content;
    if (data.parentId !== undefined) updates.parentId = data.parentId ?? undefined;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;
    if (data.template !== undefined) updates.template = data.template;
    if (data.status !== undefined) updates.status = data.status;
    if (data.seoTitle !== undefined) updates.seoTitle = data.seoTitle ?? undefined;
    if (data.seoDescription !== undefined) updates.seoDescription = data.seoDescription ?? undefined;

    const [updated] = await db.update(pages).set(updates).where(eq(pages.id, id)).returning();
    return apiSuccess(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    if (!["admin", "editor"].includes(session.user.role)) return apiError("Доступ запрещён", 403);

    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);

    const existing = await db.query.pages.findFirst({ where: eq(pages.id, id) });
    if (!existing) return apiError("Страница не найдена", 404);

    await db.delete(pages).where(eq(pages.id, id));
    return apiSuccess({ deleted: true });
  });
}
