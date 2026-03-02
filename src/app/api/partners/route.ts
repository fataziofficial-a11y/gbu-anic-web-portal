import { auth } from "@/auth";
import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { asc } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(255),
  logoId: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  services: z.string().optional().nullable(),
  websiteUrl: z.string().max(1000).optional().nullable(),
  projectIds: z.array(z.number().int()).default([]),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  return withErrorHandler(async () => {
    const items = await db.query.partners.findMany({
      orderBy: [asc(partners.sortOrder), asc(partners.name)],
      with: { logo: true },
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
    const [created] = await db.insert(partners).values({
      name: data.name,
      logoId: data.logoId ?? undefined,
      description: data.description ?? undefined,
      services: data.services ?? undefined,
      websiteUrl: data.websiteUrl ?? undefined,
      projectIds: data.projectIds,
      sortOrder: data.sortOrder,
    }).returning();

    return apiSuccess(created, 201);
  });
}
