/**
 * Синхронизация новостей с Tilda-сайта аниц.рф → ase-msk.ru
 *
 * ЗАПУСК:
 *   DATABASE_URL='...' npx tsx scripts/sync-anic-news.ts
 *
 * Что делает:
 *   1. Загружает все новости через Tilda Feed API (getfeed + getpost)
 *   2. Для каждой новости скачивает обложку
 *   3. Если новость уже есть (по sourceUrl) — обновляет (текст + фото)
 *   4. Если нет — создаёт новую
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { news, files } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateSlug } from "../src/lib/utils/slug";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// ===================== CONFIG =====================
const FEED_UID = "931548271151";
const FEED_RECID = "1022188301";
const FEED_BASE = "https://feeds.tildacdn.com/api";
const REFERER = "http://xn--80aqo1b.xn--p1ai/";
const SLICES = [1, 2, 3]; // страницы фида
const BATCH_SIZE = 100;
const DELAY_MS = 300;
// ==================================================

const connectionString = (process.env.DATABASE_URL ?? "").replace(/^"|"$/g, "");
if (!connectionString) { console.error("DATABASE_URL не задан"); process.exit(1); }

const client = postgres(connectionString, { max: 2 });
const db = drizzle(client);

// ---------- HTTP helpers ----------

function fetchJson(url: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === "https:" ? https : http;
    const req = transport.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        "Referer": REFERER,
      },
      timeout: 20000,
    }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode} for ${url}`)); return; }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
        catch (e) { reject(e); }
      });
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

async function downloadImage(imgUrl: string): Promise<{ localUrl: string; size: number } | null> {
  return new Promise((resolve) => {
    const transport = imgUrl.startsWith("https") ? https : http;
    const req = transport.get(imgUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 20000,
    }, (res) => {
      // Follow redirects
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        resolve(downloadImage(res.headers.location));
        return;
      }
      if (res.statusCode !== 200) { resolve(null); return; }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        if (buf.length < 1000) { resolve(null); return; } // skip tiny/broken images
        const ext = imgUrl.match(/\.(jpe?g|png|webp)/i)?.[1] ?? "jpg";
        const filename = `anic-news-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const dest = path.join(process.cwd(), "public", "uploads", filename);
        try {
          fs.writeFileSync(dest, buf);
          resolve({ localUrl: `/uploads/${filename}`, size: buf.length });
        } catch { resolve(null); }
      });
      res.on("error", () => resolve(null));
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

// ---------- Tilda feed ----------

interface TildaPost {
  uid: string;
  title: string;
  descr: string;
  text: string;
  image: string;
  date: string;
  url: string;
  needGetPost: boolean;
}

async function fetchAllPosts(): Promise<TildaPost[]> {
  const all: TildaPost[] = [];
  for (const slice of SLICES) {
    const url = `${FEED_BASE}/getfeed/?feeduid=${FEED_UID}&recid=${FEED_RECID}&c=1&size=${BATCH_SIZE}&slice=${slice}&sort%5Bdate%5D=desc&sort%5Bpublished%5D=desc`;
    try {
      const data = await fetchJson(url) as { posts?: TildaPost[] };
      const posts = data.posts ?? [];
      if (posts.length === 0) break;
      all.push(...posts);
      console.log(`  Slice ${slice}: ${posts.length} постов`);
      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  Ошибка slice ${slice}:`, err);
      break;
    }
  }
  return all;
}

async function fetchPostContent(uid: string): Promise<string> {
  try {
    const url = `${FEED_BASE}/getpost/?postuid=${uid}&feeduid=${FEED_UID}&recid=${FEED_RECID}`;
    const data = await fetchJson(url) as { post?: { text?: string } };
    return data.post?.text ?? "";
  } catch {
    return "";
  }
}

// ---------- HTML → Tiptap ----------

function htmlToTiptap(html: string): Record<string, unknown> {
  if (!html) return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: " " }] }] };

  // Strip HTML tags, split by <br> and block elements into paragraphs
  const blocks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: " " }] }] };
  }

  return {
    type: "doc",
    content: blocks.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  };
}

// ---------- DB helpers ----------

async function registerFile(localUrl: string, originalName: string): Promise<number | null> {
  try {
    const fullPath = path.join(process.cwd(), "public", localUrl);
    const stat = fs.statSync(fullPath);
    const filename = path.basename(localUrl);
    const ext = path.extname(filename).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    const [created] = await db.insert(files).values({
      filename,
      originalName,
      url: localUrl,
      mimeType: mime,
      sizeBytes: stat.size,
      folder: "media",
    }).returning({ id: files.id });
    return created.id;
  } catch {
    return null;
  }
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ---------- Main ----------

async function main() {
  console.log("Синхронизация новостей с аниц.рф...\n");

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // 1. Fetch all posts from Tilda
  console.log("Загрузка списка новостей...");
  const posts = await fetchAllPosts();
  console.log(`\nВсего: ${posts.length} новостей\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const post of posts) {
    const sourceUrl = post.url || `https://xn--80aqo1b.xn--p1ai/tpost/${post.uid}`;

    try {
      // Check if exists
      const existing = await db
        .select({ id: news.id, coverImageId: news.coverImageId, title: news.title })
        .from(news)
        .where(eq(news.sourceUrl, sourceUrl));

      // Fetch full content if needed
      let fullText = post.text || "";
      if ((!fullText || fullText.length < 10) && post.needGetPost) {
        fullText = await fetchPostContent(post.uid);
        await sleep(DELAY_MS);
      }

      const content = htmlToTiptap(fullText);
      const publishedAt = parseDate(post.date) ?? new Date();

      // Download cover image
      let coverImageId: number | null = null;
      if (post.image) {
        const dl = await downloadImage(post.image);
        if (dl) {
          coverImageId = await registerFile(dl.localUrl, path.basename(dl.localUrl));
        }
      }

      if (existing.length > 0) {
        // UPDATE existing news
        const record = existing[0];
        const updates: Record<string, unknown> = {};

        // Always update content if we have it
        if (fullText && fullText.length > 10) {
          updates.content = content;
        }

        // Update cover image if currently missing
        if (coverImageId && !record.coverImageId) {
          updates.coverImageId = coverImageId;
        }

        // Update title if different
        if (post.title && post.title !== record.title) {
          updates.title = post.title;
        }

        if (Object.keys(updates).length > 0) {
          updates.updatedAt = new Date();
          await db.update(news).set(updates).where(eq(news.id, record.id));
          console.log(`  ↻ обновлена: ${post.title.slice(0, 65)}`);
          updated++;
        } else {
          console.log(`  · без изменений: ${post.title.slice(0, 65)}`);
          skipped++;
        }
      } else {
        // CREATE new news
        let slug = generateSlug(post.title);
        if (!slug) slug = `news-${Date.now()}`;

        // Ensure unique slug
        const slugExists = await db.select({ id: news.id }).from(news).where(eq(news.slug, slug));
        if (slugExists.length > 0) slug = `${slug}-${Date.now()}`;

        await db.insert(news).values({
          title: post.title,
          slug,
          content,
          excerpt: post.descr || undefined,
          status: "published",
          sourceUrl,
          publishedAt,
          coverImageId,
        });

        console.log(`  ✓ создана: ${post.title.slice(0, 65)}`);
        created++;
      }

      await sleep(200);
    } catch (err) {
      console.error(`  ✗ ошибка: ${post.title.slice(0, 60)}`, err);
      errors++;
    }
  }

  console.log(`\nГотово: создано ${created}, обновлено ${updated}, без изменений ${skipped}, ошибок ${errors}`);
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
