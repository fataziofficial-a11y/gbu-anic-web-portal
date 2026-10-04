import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { appeals } from "@/lib/db/schema";
import { canSeeAppeals } from "@/lib/appeals-access";

// Список обращений с сайта — для раздела «Обращения» в админке.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canSeeAppeals(session))) return NextResponse.json({ error: "Нет доступа к обращениям" }, { status: 403 });

  const rows = await db.select().from(appeals).orderBy(desc(appeals.createdAt)).limit(500);
  return NextResponse.json({ data: rows });
}
