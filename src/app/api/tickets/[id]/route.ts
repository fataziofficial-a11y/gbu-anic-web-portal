import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tickets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["new", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  adminComment: z.string().max(2000).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, Number(id)));
  if (!ticket) return NextResponse.json({ error: "Не найден" }, { status: 404 });

  return NextResponse.json({ data: ticket });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.status === "resolved") updates.resolvedAt = new Date();

  const [updated] = await db
    .update(tickets)
    .set(updates)
    .where(eq(tickets.id, Number(id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Не найден" }, { status: 404 });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Только администратор" }, { status: 403 });
  }

  const { id } = await params;
  await db.delete(tickets).where(eq(tickets.id, Number(id)));
  return NextResponse.json({ ok: true });
}
