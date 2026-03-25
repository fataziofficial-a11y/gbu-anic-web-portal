/**
 * Импорт видео с Rutube-канала АНИЦ в раздел "Медиа".
 *
 * ЗАПУСК:
 *   pnpm tsx scripts/import-rutube-channel.ts
 *
 * Что делает:
 *   1. Загружает все страницы видео с канала через публичный API Rutube
 *   2. Скачивает превью каждого видео в public/uploads/
 *   3. Регистрирует превью в таблице files
 *   4. Вставляет запись в media_items с embed-ссылкой (дедупликация по videoUrl)
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { mediaItems, files } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CHANNEL_ID = 34969844;
const PAGE_SIZE = 20;

const connectionString = (process.env.DATABASE_URL ?? "").replace(/^"|"$/g, "");
if (!connectionString) { console.error("DATABASE_URL не задан"); process.exit(1); }

const client = postgres(connectionString, { max: 2 });
const db = drizzle(client);

interface RutubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  embed_url: string;
  created_ts: string;
}

interface PageResponse {
  results: RutubeVideo[];
  has_next: boolean;
  num_pages: number;
}

async function fetchPage(page: number): Promise<PageResponse> {
  const url = `https://rutube.ru/api/video/person/${CHANNEL_ID}/?page=${page}&page_size=${PAGE_SIZE}&format=json`;
  const data = await new Promise<string>((resolve, reject) => {
    const req = https.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 15000,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
  return JSON.parse(data) as PageResponse;
}

async function downloadImage(imgUrl: string): Promise<{ localUrl: string; size: number } | null> {
  return new Promise((resolve) => {
    const transport = imgUrl.startsWith("https") ? https : http;
    const req = transport.get(imgUrl, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) { resolve(null); return; }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        const ext = imgUrl.match(/\.(jpe?g|png|webp)/i)?.[1] ?? "jpg";
        const filename = `rutube-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const dest = path.join(process.cwd(), "public", "uploads", filename);
        try {
          fs.writeFileSync(dest, buf);
          resolve({ localUrl: `/uploads/${filename}`, size: buf.length });
        } catch {
          resolve(null);
        }
      });
      res.on("error", () => resolve(null));
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

async function main() {
  console.log(`Импорт видео с Rutube-канала АНИЦ (id=${CHANNEL_ID})...\n`);

  // Убеждаемся что папка uploads существует
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  let page = 1;
  let allVideos: RutubeVideo[] = [];

  // Загружаем все страницы
  while (true) {
    console.log(`  Страница ${page}...`);
    try {
      const data = await fetchPage(page);
      allVideos = allVideos.concat(data.results);
      if (!data.has_next || page >= data.num_pages) break;
      page++;
      await new Promise((r) => setTimeout(r, 400)); // вежливая пауза
    } catch (err) {
      console.error(`  Ошибка на странице ${page}:`, err);
      break;
    }
  }

  console.log(`\nНайдено ${allVideos.length} видео. Импортируем...\n`);

  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const video of allVideos) {
    const embedUrl = `https://rutube.ru/play/embed/${video.id}`;

    // Дедупликация по embedUrl
    const existing = await db
      .select({ id: mediaItems.id })
      .from(mediaItems)
      .where(eq(mediaItems.videoUrl, embedUrl));

    if (existing.length > 0) {
      console.log(`  пропущено: ${video.title.slice(0, 60)}`);
      skipped++;
      continue;
    }

    try {
      // Скачиваем превью
      let thumbnailId: number | undefined;
      if (video.thumbnail_url) {
        const dl = await downloadImage(video.thumbnail_url);
        if (dl) {
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
      const eventDate = video.created_ts
        ? video.created_ts.split("T")[0]
        : undefined;

      await db.insert(mediaItems).values({
        title: video.title,
        description: video.description || undefined,
        type: "video",
        videoUrl: embedUrl,
        thumbnailId,
        eventDate,
        status: "published",
      });

      console.log(`  ✓ ${video.title.slice(0, 70)}`);
      added++;

      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`  ✗ ошибка: ${video.title.slice(0, 60)}`, err);
      errors++;
    }
  }

  console.log(`\nГотово: добавлено ${added}, пропущено ${skipped}, ошибок ${errors}`);
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
