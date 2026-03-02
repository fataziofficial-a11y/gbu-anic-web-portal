import { auth } from "@/auth";
import { db } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { asc, count } from "drizzle-orm";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(255),
  position: z.string().max(255).optional(),
  departmentId: z.number().int().optional().nullable(),
  photoId: z.number().int().optional().nullable(),
  bio: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  return withErrorHandler(async () => {
    const items = await db.query.teamMembers.findMany({
      orderBy: [asc(teamMembers.sortOrder), asc(teamMembers.name)],
      with: { department: true, photo: true },
    });
    const total = await db.select({ count: count() }).from(teamMembers);
    return apiSuccess({ items, total: total[0].count });
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const body = await request.json();
    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const data = parsed.data;
    const [created] = await db.insert(teamMembers).values({
      name: data.name,
      position: data.position,
      departmentId: data.departmentId ?? undefined,
      photoId: data.photoId ?? undefined,
      bio: data.bio,
      email: data.email || undefined,
      sortOrder: data.sortOrder,
    }).returning();

    return apiSuccess(created, 201);
  });
}
