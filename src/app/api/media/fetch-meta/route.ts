/**
 * GET /api/media/fetch-meta?url=...
 *
 * Получает метаданные видео с Rutube или VK по ссылке,
 * скачивает превью и регистрирует его в таблице files.
 *
 * Возвращает: { title, description, embedUrl, thumbnailId, thumbnailUrl, eventDate }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import path from "path";
import fs from "fs";

// ---------- Helpers ----------

function extractRutubeId(url: string): string | null {
  // https://rutube.ru/video/{id}/
  // https://rutube.ru/play/embed/{id}
  const m = url.match(/rutube\.ru\/(?:video|play\/embed)\/([a-f0-9]{32})/i);
  return m ? m[1] : null;
}

function extractVkVideoId(url: string): { ownerId: string; videoId: string } | null {
  // https://vk.com/video-123456_789
  // https://vk.com/video?z=video-123456_789
  const m = url.match(/video(-?\d+)_(\d+)/);
  return m ? { ownerId: m[1], videoId: m[2] } : null;
}

async function downloadThumbnail(imgUrl: string): Promise<{ localUrl: string; size: number } | null> {
  try {
    const res = await fetch(imgUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.match(/\.(jpe?g|png|webp)/i)?.[1] ?? "jpg";
    const filename = `rutube-thumb-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const dest = path.join(process.cwd(), "public", "uploads", filename);
    fs.writeFileSync(dest, buf);
    return { localUrl: `/uploads/${filename}`, size: buf.length };
  } catch {
    return null;
  }
}

// ---------- Route ----------

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) return NextResponse.json({ error: "url обязателен" }, { status: 400 });

  // ---- Rutube ----
  const rutubeId = extractRutubeId(rawUrl);
  if (rutubeId) {
    const apiRes = await fetch(
      `https://rutube.ru/api/video/${rutubeId}/?format=json`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) }
    );
    if (!apiRes.ok) return NextResponse.json({ error: "Не удалось получить данные с Rutube" }, { status: 502 });

    const data = await apiRes.json();

    // Скачиваем превью
    let thumbnailId: number | null = null;
    let thumbnailUrl: string | null = null;
    const thumbSrc = data.thumbnail_url || data.preview_url;
    if (thumbSrc) {
      const dl = await downloadThumbnail(thumbSrc);
      if (dl) {
        thumbnailUrl = dl.localUrl;
        const [f] = await db.insert(files).values({
          filename: path.basename(dl.localUrl),
          originalName: path.basename(dl.localUrl),
          url: dl.localUrl,
          mimeType: "image/jpeg",
          sizeBytes: dl.size,
          folder: "media",
        }).returning({ id: files.id });
        thumbnailId = f.id;
      }
    }

    // Дата из created_ts
    const eventDate = data.created_ts
      ? data.created_ts.split("T")[0]
      : null;

    return NextResponse.json({
      data: {
        title: data.title ?? "",
        description: data.description ?? "",
        embedUrl: `https://rutube.ru/play/embed/${rutubeId}`,
        thumbnailId,
        thumbnailUrl,
        eventDate,
      },
    });
  }

  // ---- VK ----
  const vkIds = extractVkVideoId(rawUrl);
  if (vkIds) {
    // VK OEmbed (не требует токена)
    const oembedRes = await fetch(
      `https://vk.com/oembed.json?url=${encodeURIComponent(rawUrl)}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) }
    );

    let title = "";
    let description = "";
    let embedUrl = "";
    let thumbnailUrl: string | null = null;
    let thumbnailId: number | null = null;

    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      title = oembed.title ?? "";
      // Извлекаем src из HTML embed
      const srcMatch = (oembed.html ?? "").match(/src="([^"]+)"/);
      embedUrl = srcMatch ? srcMatch[1] : "";

      if (oembed.thumbnail_url) {
        const dl = await downloadThumbnail(oembed.thumbnail_url);
        if (dl) {
          thumbnailUrl = dl.localUrl;
          const [f] = await db.insert(files).values({
            filename: path.basename(dl.localUrl),
            originalName: path.basename(dl.localUrl),
            url: dl.localUrl,
            mimeType: "image/jpeg",
            sizeBytes: dl.size,
            folder: "media",
          }).returning({ id: files.id });
          thumbnailId = f.id;
        }
      }
    } else {
      // Fallback: строим embed URL вручную
      embedUrl = `https://vk.com/video_ext.php?oid=${vkIds.ownerId}&id=${vkIds.videoId}&hd=2`;
    }

    return NextResponse.json({
      data: { title, description, embedUrl, thumbnailId, thumbnailUrl, eventDate: null },
    });
  }

  return NextResponse.json({ error: "Поддерживаются только ссылки Rutube и VK" }, { status: 400 });
}
