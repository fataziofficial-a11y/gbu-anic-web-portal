import { auth } from "@/auth";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

const createDeptSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(255),
  slug: z.string().max(255).optional(),
  description: z.string().optional(),
  headId: z.number().int().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  return withErrorHandler(async () => {
    const items = await db.query.departments.findMany({
      orderBy: [asc(departments.sortOrder), asc(departments.name)],
      with: { head: true, teamMembers: true },
    });
    return apiSuccess({ items, total: items.length });
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    if (session.user.role !== "admin") return apiError("Доступ запрещён", 403);

    const body = await request.json();
    const parsed = createDeptSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const slug = data.slug ?? generateSlug(data.name);

    const existing = await db.query.departments.findFirst({ where: eq(departments.slug, slug) });
    if (existing) return apiError("Подразделение с таким slug уже существует", 409);

    const [created] = await db.insert(departments).values({
      name: data.name,
      slug,
      description: data.description,
      headId: data.headId ?? undefined,
      sortOrder: data.sortOrder,
    }).returning();

    return apiSuccess(created, 201);
  });
}
