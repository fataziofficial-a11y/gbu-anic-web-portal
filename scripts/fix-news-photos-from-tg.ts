/**
 * Привязка фотографий из Telegram-канала arctic_yakutia к новостям без обложек.
 *
 * ЗАПУСК:
 *   DATABASE_URL='...' npx tsx scripts/fix-news-photos-from-tg.ts
 *
 * Что делает:
 *   1. Загружает посты из Telegram через t.me/s/ (public preview)
 *   2. Для каждой новости без обложки ищет совпадение по тексту
 *   3. Скачивает фото из Telegram и привязывает как coverImage
 */

import fs from "fs";
import path from "path";
import https from "https";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { news, files } from "../src/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CHANNEL = "arctic_yakutia";
const connectionString = (process.env.DATABASE_URL ?? "").replace(/^"|"$/g, "");
if (!connectionString) { console.error("DATABASE_URL не задан"); process.exit(1); }

const client = postgres(connectionString, { max: 2 });
const db = drizzle(client);

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

interface TgPost {
  id: number;
  text: string;
  imageUrl: string | null;
}

async function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" },
      timeout: 20000,
    }, (res) => {
      if (res.statusCode === 302 && res.headers.location) {
        resolve(fetchHtml(res.headers.location));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function parseTgPage(html: string): TgPost[] {
  const posts: TgPost[] = [];

  // Split by message blocks
  const msgRegex = new RegExp(
    `data-post="${CHANNEL}/(\\d+)"[\\s\\S]*?(?=data-post="${CHANNEL}/|$)`,
    "g"
  );

  let match;
  while ((match = msgRegex.exec(html)) !== null) {
    const postId = parseInt(match[1]);
    const block = match[0];

    // Extract image
    const imgMatch = block.match(/tgme_widget_message_photo_wrap[^>]*style="[^"]*background-image:url\('([^']+)'\)/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    // Extract text
    const textMatch = block.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
    let text = "";
    if (textMatch) {
      text = textMatch[1]
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#33;/g, "!")
        .replace(/\s+/g, " ")
        .trim();
    }

    if (text || imageUrl) {
      posts.push({ id: postId, text, imageUrl });
    }
  }

  return posts;
}

async function fetchAllTgPosts(): Promise<TgPost[]> {
  const all: TgPost[] = [];
  const seen = new Set<number>();

  // Fetch latest and then paginate backwards
  let before = "";
  for (let page = 0; page < 30; page++) {
    const url = before
      ? `https://t.me/s/${CHANNEL}?before=${before}`
      : `https://t.me/s/${CHANNEL}`;

    console.log(`  Fetching: ${url}`);
    const html = await fetchHtml(url);
    const posts = parseTgPage(html);

    if (posts.length === 0) break;

    let newCount = 0;
    for (const p of posts) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        all.push(p);
        newCount++;
      }
    }

    if (newCount === 0) break;

    // Get the lowest post ID for pagination
    const minId = Math.min(...posts.map((p) => p.id));
    before = String(minId);

    await sleep(500);
  }

  return all.sort((a, b) => b.id - a.id);
}

async function downloadImage(imgUrl: string): Promise<{ localUrl: string; size: number } | null> {
  return new Promise((resolve) => {
    https.get(imgUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 20000,
    }, (res) => {
      if (res.statusCode === 302 && res.headers.location) {
        resolve(downloadImage(res.headers.location));
        return;
      }
      if (res.statusCode !== 200) { resolve(null); return; }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        if (buf.length < 1000) { resolve(null); return; }
        const filename = `tg-news-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const dest = path.join(process.cwd(), "public", "uploads", filename);
        try {
          fs.writeFileSync(dest, buf);
          resolve({ localUrl: `/uploads/${filename}`, size: buf.length });
        } catch { resolve(null); }
      });
      res.on("error", () => resolve(null));
    }).on("error", () => resolve(null));
  });
}

async function registerFile(localUrl: string): Promise<number | null> {
  try {
    const fullPath = path.join(process.cwd(), "public", localUrl);
    const stat = fs.statSync(fullPath);
    const [created] = await db.insert(files).values({
      filename: path.basename(localUrl),
      originalName: path.basename(localUrl),
      url: localUrl,
      mimeType: "image/jpeg",
      sizeBytes: stat.size,
      folder: "media",
    }).returning({ id: files.id });
    return created.id;
  } catch { return null; }
}

/** Normalize text for fuzzy matching */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\wа-яёА-ЯЁ\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Check if two texts match (one contains significant portion of the other) */
function textsMatch(newsTitle: string, tgText: string): boolean {
  const nt = norm(newsTitle);
  const tt = norm(tgText);

  // Direct contains
  if (tt.includes(nt) || nt.includes(tt)) return true;

  // Check first N words overlap
  const nWords = nt.split(" ").slice(0, 8);
  const tWords = tt.split(" ");
  if (nWords.length >= 4) {
    const phrase = nWords.join(" ");
    if (tt.includes(phrase)) return true;
  }

  // Check word overlap ratio
  const nSet = new Set(nt.split(" ").filter((w) => w.length > 3));
  const tSet = new Set(tt.split(" ").filter((w) => w.length > 3));
  if (nSet.size === 0) return false;
  let overlap = 0;
  for (const w of nSet) {
    if (tSet.has(w)) overlap++;
  }
  const ratio = overlap / nSet.size;
  return ratio >= 0.6 && overlap >= 3;
}

async function main() {
  console.log("Привязка фото из Telegram к новостям без обложек...\n");

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // 1. Get news without covers
  const noPhoto = await db
    .select({ id: news.id, title: news.title })
    .from(news)
    .where(isNull(news.coverImageId));

  console.log(`Новостей без обложки: ${noPhoto.length}\n`);
  if (noPhoto.length === 0) { await client.end(); return; }

  // 2. Fetch TG posts
  console.log("Загрузка постов из Telegram...");
  const tgPosts = await fetchAllTgPosts();
  const withImages = tgPosts.filter((p) => p.imageUrl);
  console.log(`\nВсего постов: ${tgPosts.length}, с картинками: ${withImages.length}\n`);

  // 3. Match and update
  let matched = 0;
  let notFound = 0;

  for (const item of noPhoto) {
    // Find matching TG post
    const match = withImages.find((p) => textsMatch(item.title, p.text));

    if (!match) {
      console.log(`  ✗ не найдено: ${item.title.slice(0, 60)}`);
      notFound++;
      continue;
    }

    // Download image
    const dl = await downloadImage(match.imageUrl!);
    if (!dl) {
      console.log(`  ⚠ не удалось скачать фото: ${item.title.slice(0, 60)}`);
      notFound++;
      continue;
    }

    const fileId = await registerFile(dl.localUrl);
    if (!fileId) {
      console.log(`  ⚠ не удалось зарегистрировать файл: ${item.title.slice(0, 60)}`);
      notFound++;
      continue;
    }

    await db.update(news).set({ coverImageId: fileId, updatedAt: new Date() }).where(eq(news.id, item.id));
    console.log(`  ✓ [tg/${match.id}] → ${item.title.slice(0, 55)}`);
    matched++;

    await sleep(300);
  }

  console.log(`\nГотово: привязано ${matched}, не найдено ${notFound}`);
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
