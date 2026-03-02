import { auth } from "@/auth";
import { db } from "@/lib/db";
import { procurements } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { desc } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(1000),
  description: z.string().optional().nullable(),
  eisUrl: z.string().max(1000).optional().nullable(),
  publishedAt: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  amount: z.string().max(255).optional().nullable(),
  status: z.enum(["open", "closed", "cancelled"]).default("open"),
});

export async function GET() {
  return withErrorHandler(async () => {
    const items = await db.query.procurements.findMany({
      orderBy: [desc(procurements.createdAt)],
    });
    return apiSuccess({ items, total: items.length });
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const [created] = await db.insert(procurements).values({
      title: data.title,
      description: data.description ?? undefined,
      eisUrl: data.eisUrl ?? undefined,
      publishedAt: data.publishedAt ?? undefined,
      deadline: data.deadline ?? undefined,
      amount: data.amount ?? undefined,
      status: data.status,
    }).returning();

    return apiSuccess(created, 201);
  });
}
