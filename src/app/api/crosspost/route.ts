import { auth } from "@/auth";
import { db } from "@/lib/db";
import { crosspostLog, news } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { desc, eq } from "drizzle-orm";
import { postToTelegram } from "@/lib/crosspost/telegram";
import { postToVk } from "@/lib/crosspost/vk";
import { postToMax } from "@/lib/crosspost/max";
import { postToDzen } from "@/lib/crosspost/dzen";
import { postToOk } from "@/lib/crosspost/ok";
import { z } from "zod";

const PLATFORM_LABELS: Record<string, string> = {
  telegram: "Telegram",
  vk: "ВКонтакте",
  max: "MAX",
  dzen: "Яндекс.Дзен",
  ok: "Одноклассники",
};

const crosspostSchema = z.object({
  contentType: z.enum(["news", "knowledge"]),
  contentId: z.number().int().positive(),
  platforms: z.array(z.enum(["telegram", "vk", "max", "dzen", "ok"])).min(1),
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
      limit: 100,
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
      let ok = false;
      let externalPostId: string | undefined;
      let externalUrl: string | undefined;
      let error: string | undefined;

      if (platform === "telegram") {
        const r = await postToTelegram({ title, excerpt, url });
        ok = r.ok;
        externalPostId = r.messageId ? String(r.messageId) : undefined;
        error = r.error;
      } else if (platform === "vk") {
        const r = await postToVk({ title, excerpt, url });
        ok = r.ok;
        externalPostId = r.postId ? String(r.postId) : undefined;
        externalUrl = r.postUrl;
        error = r.error;
      } else if (platform === "max") {
        const r = await postToMax({ title, excerpt, url });
        ok = r.ok;
        externalPostId = r.postId;
        error = r.error;
      } else if (platform === "dzen") {
        const r = await postToDzen({ title, excerpt, url });
        ok = r.ok;
        externalPostId = r.postId;
        externalUrl = r.postUrl;
        error = r.error;
      } else if (platform === "ok") {
        const r = await postToOk({ title, excerpt, url });
        ok = r.ok;
        externalPostId = r.postId;
        externalUrl = r.postUrl;
        error = r.error;
      }

      results.push({ platform, ok, externalPostId, externalUrl, error });

      await db.insert(crosspostLog).values({
        contentType,
        contentId,
        platform,
        status: ok ? "sent" : "failed",
        externalPostId: externalPostId ?? null,
        externalUrl: externalUrl ?? null,
        errorMessage: error ?? null,
        sentAt: ok ? new Date() : null,
      });
    }

    return apiSuccess({ results });
  });
}
