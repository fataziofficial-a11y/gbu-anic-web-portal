import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "news_editor", "researcher", "hr_specialist", "procurement_specialist", "editor", "author"]).optional(),
  permissions: z.array(z.string()).nullable().optional(),
});

function parseId(raw: string) {
  const n = parseInt(raw);
  return isNaN(n) ? null : n;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Неверный ID" }, { status: 400 });

  // Пользователь может смотреть только себя, admin/hr — всех
  const isSelf = String(id) === String(session.user.id);
  const isPrivileged = session.user.role === "admin" || session.user.role === "hr_specialist";
  if (!isSelf && !isPrivileged) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { passwordHash: false },
  });
  if (!user) return NextResponse.json({ error: "Не найден" }, { status: 404 });

  return NextResponse.json({ data: user });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Неверный ID" }, { status: 400 });

  const isSelf = String(id) === String(session.user.id);
  const isAdmin = session.user.role === "admin";
  const isHr = session.user.role === "hr_specialist";
  const isPrivileged = isAdmin || isHr;

  // hr_specialist может редактировать любого, но не менять permissions
  // admin — всё
  if (!isSelf && !isPrivileged) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email;
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.password) {
    updates.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }
  // Только admin может менять permissions
  if (isAdmin && parsed.data.permissions !== undefined) {
    updates.permissions = parsed.data.permissions;
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      permissions: users.permissions,
    });

  if (!updated) return NextResponse.json({ error: "Не найден" }, { status: 404 });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Только администратор" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Неверный ID" }, { status: 400 });

  // Запрещаем удалять себя
  if (String(id) === String(session.user.id)) {
    return NextResponse.json({ error: "Нельзя удалить себя" }, { status: 400 });
  }

  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}
