import { auth } from "@/auth";
import { db } from "@/lib/db";
import { crosspostLog, news } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { desc, eq } from "drizzle-orm";
import { postToTelegram } from "@/lib/crosspost/telegram";
import { postToVk } from "@/lib/crosspost/vk";
import { z } from "zod";

const crosspostSchema = z.object({
  contentType: z.enum(["news", "knowledge"]),
  contentId: z.number().int().positive(),
  platforms: z.array(z.enum(["telegram", "vk"])).min(1),
});

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get("contentType") ?? undefined;
    const contentId = searchParams.get("contentId") ? parseInt(searchParams.get("contentId")!) : undefined;

    const items = await db.query.crosspostLog.findMany({
      where: contentType && contentId
        ? (log, { and, eq }) => and(eq(log.contentType, contentType), eq(log.contentId, contentId))
        : undefined,
      orderBy: [desc(crosspostLog.createdAt)],
      limit: 50,
    });

    return apiSuccess({ items });
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const body = await request.json();
    const parsed = crosspostSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const { contentType, contentId, platforms } = parsed.data;

    // Получаем данные для поста
    let title = "";
    let excerpt: string | undefined;
    let slug = "";

    if (contentType === "news") {
      const item = await db.query.news.findFirst({ where: eq(news.id, contentId) });
      if (!item) return apiError("Новость не найдена", 404);
      if (item.status !== "published") return apiError("Публикуйте материал перед кросс-постингом", 400);
      title = item.title;
      excerpt = item.excerpt ?? undefined;
      slug = item.slug;
    }

    const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const url = `${siteUrl}/news/${slug}`;

    const results: { platform: string; ok: boolean; externalPostId?: string; externalUrl?: string; error?: string }[] = [];

    for (const platform of platforms) {
      let result: { ok: boolean; messageId?: number; postId?: number; postUrl?: string; error?: string };

      if (platform === "telegram") {
        result = await postToTelegram({ title, excerpt, url });
        results.push({
          platform,
          ok: result.ok,
          externalPostId: result.messageId ? String(result.messageId) : undefined,
          error: result.error,
        });
      } else if (platform === "vk") {
        result = await postToVk({ title, excerpt, url });
        results.push({
          platform,
          ok: result.ok,
          externalPostId: result.postId ? String(result.postId) : undefined,
          externalUrl: result.postUrl,
          error: result.error,
        });
      }

      // Пишем в лог
      const r = results[results.length - 1];
      await db.insert(crosspostLog).values({
        contentType,
        contentId,
        platform,
        status: r.ok ? "sent" : "failed",
        externalPostId: r.externalPostId ?? null,
        externalUrl: r.externalUrl ?? null,
        errorMessage: r.error ?? null,
        sentAt: r.ok ? new Date() : null,
      });
    }

    return apiSuccess({ results });
  });
}
