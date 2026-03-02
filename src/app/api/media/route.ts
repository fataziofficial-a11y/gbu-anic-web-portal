import { auth } from "@/auth";
import { db } from "@/lib/db";
import { mediaItems } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(500),
  description: z.string().optional().nullable(),
  type: z.enum(["video", "photo"]).default("video"),
  videoUrl: z.string().max(1000).optional().nullable(),
  thumbnailId: z.number().int().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  status: z.enum(["published", "draft"]).default("published"),
});

export async function GET() {
  return withErrorHandler(async () => {
    const items = await db.query.mediaItems.findMany({
      orderBy: [desc(mediaItems.createdAt)],
      with: { thumbnail: true },
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
    const [created] = await db.insert(mediaItems).values({
      title: data.title,
      description: data.description ?? undefined,
      type: data.type,
      videoUrl: data.videoUrl ?? undefined,
      thumbnailId: data.thumbnailId ?? undefined,
      eventDate: data.eventDate ?? undefined,
      sortOrder: data.sortOrder,
      status: data.status,
    }).returning();

    return apiSuccess(created, 201);
  });
}

export async function GET_published() {
  return withErrorHandler(async () => {
    const items = await db.query.mediaItems.findMany({
      where: eq(mediaItems.status, "published"),
      orderBy: [desc(mediaItems.createdAt)],
      with: { thumbnail: true },
    });
    return apiSuccess({ items, total: items.length });
  });
}
