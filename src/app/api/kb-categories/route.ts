import { auth } from "@/auth";
import { db } from "@/lib/db";
import { kbCategories } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/slug";
import { asc } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(255),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  return withErrorHandler(async () => {
    const items = await db.query.kbCategories.findMany({
      orderBy: [asc(kbCategories.sortOrder), asc(kbCategories.name)],
    });
    return apiSuccess(items);
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
    const slug = generateSlug(data.name);

    const [created] = await db.insert(kbCategories).values({
      name: data.name,
      slug,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
    }).returning();

    return apiSuccess(created, 201);
  });
}
