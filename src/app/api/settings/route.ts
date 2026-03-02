import { auth } from "@/auth";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  return withErrorHandler(async () => {
    const items = await db.query.settings.findMany({
      orderBy: (s, { asc }) => [asc(s.key)],
    });
    // Превращаем массив в объект key→value
    const map = Object.fromEntries(items.map((s) => [s.key, s.value ?? ""]));
    return apiSuccess({ items, map });
  });
}

const updateSettingsSchema = z.record(z.string(), z.string().or(z.null()));

export async function PUT(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    if (session.user.role !== "admin") return apiError("Только администратор", 403);

    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    // Upsert каждой настройки
    for (const [key, value] of Object.entries(parsed.data)) {
      const existing = await db.query.settings.findFirst({ where: eq(settings.key, key) });
      if (existing) {
        await db.update(settings).set({ value: value ?? null, updatedAt: new Date() }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value: value ?? null });
      }
    }

    return apiSuccess({ updated: Object.keys(parsed.data).length });
  });
}
