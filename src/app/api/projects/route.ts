import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { desc, eq, count, and, SQL } from "drizzle-orm";
import { z } from "zod";

const createProjectSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(500),
  slug: z.string().max(500).optional(),
  description: z.string().optional(),
  departmentId: z.number().int().optional().nullable(),
  status: z.enum(["active", "completed", "planned"]).default("active"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "";

    const conditions: SQL[] = [];
    if (status && ["active", "completed", "planned"].includes(status)) {
      conditions.push(eq(projects.status, status));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db.query.projects.findMany({
        where,
        orderBy: [desc(projects.createdAt)],
        with: { department: true },
      }),
      db.select({ count: count() }).from(projects).where(where),
    ]);

    return apiSuccess({ items, total: totalResult[0].count });
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const slug = data.slug ?? generateSlug(data.title);

    const existing = await db.query.projects.findFirst({ where: eq(projects.slug, slug) });
    if (existing) return apiError("Проект с таким slug уже существует", 409);

    const [created] = await db.insert(projects).values({
      title: data.title,
      slug,
      description: data.description,
      departmentId: data.departmentId ?? undefined,
      status: data.status,
      startDate: data.startDate ?? undefined,
      endDate: data.endDate ?? undefined,
    }).returning();

    return apiSuccess(created, 201);
  });
}
