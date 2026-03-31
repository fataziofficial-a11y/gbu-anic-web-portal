import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectRubrics } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  projectId: z.number().int(),
  name: z.string().min(1).max(255),
  sortOrder: z.number().int().optional(),
});

// GET /api/project-rubrics?projectId=X
export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(request.url);
    const projectId = parseInt(searchParams.get("projectId") ?? "");
    if (isNaN(projectId)) return apiError("projectId обязателен", 400);

    const items = await db.query.projectRubrics.findMany({
      where: eq(projectRubrics.projectId, projectId),
      orderBy: [asc(projectRubrics.sortOrder), asc(projectRubrics.name)],
    });

    return apiSuccess({ items });
  });
}

// POST /api/project-rubrics
export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const { projectId, name, sortOrder } = parsed.data;
    const slug = generateSlug(name);

    const [created] = await db
      .insert(projectRubrics)
      .values({ projectId, name, slug, sortOrder: sortOrder ?? 0 })
      .returning();

    return apiSuccess(created, 201);
  });
}
