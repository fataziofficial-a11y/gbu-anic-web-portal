import { auth } from "@/auth";
import { db } from "@/lib/db";
import { publications } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { desc } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(1000),
  authors: z.string().optional(),
  abstract: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  journal: z.string().max(500).optional(),
  doi: z.string().max(255).optional(),
  fileId: z.number().int().optional().nullable(),
  departmentId: z.number().int().optional().nullable(),
});

export async function GET() {
  return withErrorHandler(async () => {
    const items = await db.query.publications.findMany({
      orderBy: [desc(publications.createdAt)],
      with: { department: true, file: true },
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
    const [created] = await db.insert(publications).values({
      title: data.title,
      authors: data.authors ?? undefined,
      abstract: data.abstract ?? undefined,
      year: data.year ?? undefined,
      journal: data.journal ?? undefined,
      doi: data.doi ?? undefined,
      fileId: data.fileId ?? undefined,
      departmentId: data.departmentId ?? undefined,
    }).returning();

    return apiSuccess(created, 201);
  });
}
