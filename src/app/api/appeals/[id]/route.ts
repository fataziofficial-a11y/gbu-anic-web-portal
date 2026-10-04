import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { appeals } from "@/lib/db/schema";
import { canSeeAppeals } from "@/lib/appeals-access";

const patchSchema = z.object({
  status: z.enum(["new", "in_progress", "answered", "closed"]).optional(),
  adminComment: z.string().max(2000).optional(),
});

// Статус обращения и комментарий сотрудника (как и кому ответили).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canSeeAppeals(session))) return NextResponse.json({ error: "Нет доступа к обращениям" }, { status: 403 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const [updated] = await db
    .update(appeals)
    .set({ ...parsed.data, handledBy: Number(session.user.id), updatedAt: new Date() })
    .where(eq(appeals.id, Number(id)))
    .returning();
  if (!updated) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Только администратор" }, { status: 403 });
  const { id } = await params;
  await db.delete(appeals).where(eq(appeals.id, Number(id)));
  return NextResponse.json({ ok: true });
}
