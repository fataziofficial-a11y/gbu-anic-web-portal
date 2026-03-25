import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ilike, or } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createSchema = z.object({
  name: z.string().min(2, "Имя слишком короткое").max(255),
  email: z.string().email("Неверный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  role: z.enum(["admin", "news_editor", "researcher", "hr_specialist", "procurement_specialist", "editor", "author"]).default("author"),
  permissions: z.array(z.string()).optional().nullable(),
});

/** Только admin и hr_specialist имеют доступ */
function checkAccess(role: string) {
  return role === "admin" || role === "hr_specialist";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkAccess(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const search = req.nextUrl.searchParams.get("q") ?? "";

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      permissions: users.permissions,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      search
        ? or(
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`)
          )
        : undefined
    )
    .orderBy(users.name);

  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkAccess(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Только admin может выдавать произвольные permissions
  const permissions =
    session.user.role === "admin" ? (parsed.data.permissions ?? null) : null;

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const [created] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      permissions,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  return NextResponse.json({ data: created }, { status: 201 });
}
