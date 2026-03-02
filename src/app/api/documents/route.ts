import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { asc, desc } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(1000),
  docType: z.enum(["normative", "order", "regulation", "other"]).default("normative"),
  fileId: z.number().int().optional().nullable(),
  fileUrl: z.string().max(1000).optional().nullable(),
  issuedAt: z.string().optional().nullable(),
  status: z.enum(["active", "archived"]).default("active"),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  return withErrorHandler(async () => {
    const items = await db.query.documents.findMany({
      orderBy: [asc(documents.sortOrder), desc(documents.createdAt)],
      with: { file: true },
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
    const [created] = await db.insert(documents).values({
      title: data.title,
      docType: data.docType,
      fileId: data.fileId ?? undefined,
      fileUrl: data.fileUrl ?? undefined,
      issuedAt: data.issuedAt ?? undefined,
      status: data.status,
      sortOrder: data.sortOrder,
    }).returning();

    return apiSuccess(created, 201);
  });
}
