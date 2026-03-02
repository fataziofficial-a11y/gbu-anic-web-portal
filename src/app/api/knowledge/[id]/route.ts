import { auth } from "@/auth";
import { db } from "@/lib/db";
import { knowledgeItems } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { upsertDoc, deleteDoc, knowledgeDoc } from "@/lib/search/meili";

const updateKbSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.any().optional(),
  categoryId: z.number().int().optional().nullable(),
  tags: z.array(z.string()).optional(),
  departmentId: z.number().int().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  slug: z.string().max(500).optional(),
});

function parseId(raw: string) { const id = parseInt(raw); return isNaN(id) ? null : id; }

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return apiError("Неверный ID", 400);
    const item = await db.query.knowledgeItems.findFirst({
      where: eq(knowledgeItems.id, id),
      with: { author: true, category: true, department: true },
    });
    if (!item) return apiError("Материал не найден", 404);
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

    const existing = await db.query.knowledgeItems.findFirst({ where: eq(knowledgeItems.id, id) });
    if (!existing) return apiError("Материал не найден", 404);

    const body = await request.json();
    const parsed = updateKbSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const updates: Partial<typeof knowledgeItems.$inferInsert> = { updatedAt: new Date() };

    if (data.title !== undefined) { updates.title = data.title; if (!data.slug) updates.slug = generateSlug(data.title); }
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.content !== undefined) updates.content = data.content;
    if (data.categoryId !== undefined) updates.categoryId = data.categoryId ?? undefined;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.departmentId !== undefined) updates.departmentId = data.departmentId ?? undefined;
    if (data.metadata !== undefined) updates.metadata = data.metadata;
    if (data.status !== undefined) {
      updates.status = data.status;
      if (data.status === "published" && !existing.publishedAt) updates.publishedAt = new Date();
    }

    const [updated] = await db.update(knowledgeItems).set(updates).where(eq(knowledgeItems.id, id)).returning();

    if (updated.status === "published") {
      void upsertDoc(knowledgeDoc(updated));
    } else {
      void deleteDoc(`kb_${updated.id}`);
    }

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

    const existing = await db.query.knowledgeItems.findFirst({ where: eq(knowledgeItems.id, id) });
    if (!existing) return apiError("Материал не найден", 404);

    await db.delete(knowledgeItems).where(eq(knowledgeItems.id, id));
    void deleteDoc(`kb_${id}`);
    return apiSuccess({ deleted: true });
  });
}
