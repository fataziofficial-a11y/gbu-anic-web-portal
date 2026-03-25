import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tickets, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { notifyAdmin, ticketNotifyText } from "@/lib/telegram-notify";

const createSchema = z.object({
  title: z.string().min(3, "Заголовок слишком короткий").max(255),
  description: z.string().min(10, "Описание слишком короткое").max(5000),
  type: z.enum(["bug", "suggestion", "question"]).default("bug"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      type: tickets.type,
      status: tickets.status,
      priority: tickets.priority,
      createdAt: tickets.createdAt,
      author: users.name,
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.createdBy, users.id))
    .orderBy(desc(tickets.createdAt));

  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [ticket] = await db
    .insert(tickets)
    .values({
      ...parsed.data,
      createdBy: Number(session.user.id),
    })
    .returning();

  // Telegram-уведомление
  const text = ticketNotifyText({
    id: ticket.id,
    title: ticket.title,
    type: ticket.type,
    priority: ticket.priority,
    description: ticket.description,
    author: session.user.name ?? session.user.email ?? "Неизвестный",
  });
  notifyAdmin(text); // fire-and-forget

  return NextResponse.json({ data: ticket }, { status: 201 });
}
