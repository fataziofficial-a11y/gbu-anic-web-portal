/**
 * Парсер новостей с сайта-источника АНИЦ (аниц.рф).
 *
 * ЗАПУСК:
 *   pnpm tsx scripts/parse-anic-news.ts
 *
 * НАСТРОЙКА (если структура сайта изменилась):
 *   Измените константы в блоке CONFIG ниже.
 *
 * ПРИМЕЧАНИЕ:
 *   Скрипт использует cheerio для парсинга HTML.
 *   Установка (если нет): pnpm add -D cheerio
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import * as url from "url";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgres = require("postgres") as (conn: string, opts?: Record<string, unknown>) => ReturnType<typeof import("postgres")>;
import { drizzle } from "drizzle-orm/postgres-js";
import { news, files } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateSlug } from "../src/lib/utils/slug";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// ===================== CONFIG =====================
const BASE_URL = "https://аниц.рф"; // или http://anic.ru если редирект
const NEWS_LIST_PATH = "/novosti"; // страница списка новостей
const MAX_PAGES = 10; // максимум страниц для парсинга

// CSS-селекторы для страницы СПИСКА новостей
// (настройте под реальную структуру после просмотра HTML)
const SELECTORS = {
  // Карточка новости в списке
  newsCard: ".news-item, .post-item, article.item, .list-item",
  // Ссылка на полную новость (внутри карточки)
  newsLink: "a[href]",
  // Заголовок в карточке
  newsTitle: "h2, h3, .title, .post-title",
  // Дата в карточке
  newsDate: "time, .date, .post-date",
  // Обложка в карточке
  newsImage: "img",
  // Пагинация — ссылка на следующую страницу
  nextPage: 'a[href*="page="], a.next, .pagination a:last-child',

  // Селекторы для СТРАНИЦЫ СТАТЬИ
  articleTitle: "h1",
  articleBody: ".article-content, .post-content, .entry-content, main article",
  articleDate: "time, .date, .publish-date",
  articleImage: ".article-image img, .post-thumbnail img, .cover img",
};
// ==================================================

const connectionString = (process.env.DATABASE_URL ?? "").replace(/^"|"$/g, "");
if (!connectionString) {
  console.error("DATABASE_URL не задан в .env.local");
  process.exit(1);
}

const client = postgres(connectionString, { max: 2 });
const db = drizzle(client);

/** Загружает URL и возвращает HTML-строку */
async function fetchHtml(rawUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(rawUrl);
    const transport = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ANICBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ru,en;q=0.9",
      },
      timeout: 15000,
    };
    const req = transport.get(options, (res) => {
      // Обрабатываем редиректы
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (location) {
          const absolute = location.startsWith("http")
            ? location
            : new URL(location, rawUrl).href;
          resolve(fetchHtml(absolute));
          return;
        }
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} для ${rawUrl}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error(`Таймаут: ${rawUrl}`)); });
  });
}

/** Скачивает файл и сохраняет в public/uploads/, возвращает относительный URL */
async function downloadImage(imgUrl: string): Promise<string | null> {
  try {
    const ext = path.extname(new URL(imgUrl).pathname).split("?")[0] || ".jpg";
    const filename = `anic-import-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const dest = path.join(process.cwd(), "public", "uploads", filename);

    await new Promise<void>((resolve, reject) => {
      const parsed = new URL(imgUrl);
      const transport = parsed.protocol === "https:" ? https : http;
      const req = transport.get(imgUrl, (res) => {
        if (res.statusCode !== 200) { reject(new Error(`Image HTTP ${res.statusCode}`)); return; }
        const ws = fs.createWriteStream(dest);
        res.pipe(ws);
        ws.on("finish", resolve);
        ws.on("error", reject);
      });
      req.on("error", reject);
    });

    return `/uploads/${filename}`;
  } catch (err) {
    console.warn(`    ⚠ не удалось скачать изображение: ${imgUrl}`);
    return null;
  }
}

/** Регистрирует файл в таблице files и возвращает id */
async function registerFile(fileUrl: string, originalName: string): Promise<number | null> {
  try {
    const stat = fs.statSync(path.join(process.cwd(), "public", fileUrl));
    const filename = path.basename(fileUrl);
    const [created] = await db.insert(files).values({
      filename,
      originalName,
      url: fileUrl,
      mimeType: fileUrl.match(/\.png$/i) ? "image/png" : "image/jpeg",
      sizeBytes: stat.size,
      folder: "media",
      uploadedBy: 1, // системный пользователь
    }).returning({ id: files.id });
    return created.id;
  } catch {
    return null;
  }
}

interface NewsItem {
  title: string;
  sourceUrl: string;
  date?: string;
  imageUrl?: string;
}

/**
 * Парсит список новостей со страницы (cheerio)
 * Возвращает массив NewsItem и URL следующей страницы (если есть)
 */
async function parseNewsList(pageUrl: string): Promise<{ items: NewsItem[]; nextUrl: string | null }> {
  // Динамически импортируем cheerio
  let cheerio: typeof import("cheerio");
  try {
    cheerio = await import("cheerio");
  } catch {
    console.error("Cheerio не установлен. Выполните: pnpm add -D cheerio");
    process.exit(1);
  }

  const html = await fetchHtml(pageUrl);
  const $ = cheerio.load(html);

  const items: NewsItem[] = [];

  $(SELECTORS.newsCard).each((_, el) => {
    const card = $(el);
    const linkEl = card.find(SELECTORS.newsLink).first();
    const href = linkEl.attr("href");
    if (!href) return;

    const itemUrl = href.startsWith("http") ? href : new URL(href, BASE_URL).href;
    const title = card.find(SELECTORS.newsTitle).first().text().trim()
      || linkEl.text().trim();
    if (!title) return;

    const dateRaw = card.find(SELECTORS.newsDate).first().attr("datetime")
      ?? card.find(SELECTORS.newsDate).first().text().trim();
    const imgSrc = card.find(SELECTORS.newsImage).first().attr("src");
    const imgUrl = imgSrc
      ? (imgSrc.startsWith("http") ? imgSrc : new URL(imgSrc, BASE_URL).href)
      : undefined;

    items.push({ title, sourceUrl: itemUrl, date: dateRaw || undefined, imageUrl: imgUrl });
  });

  // Пагинация
  const nextLink = $(SELECTORS.nextPage).last().attr("href");
  const nextUrl = nextLink
    ? (nextLink.startsWith("http") ? nextLink : new URL(nextLink, BASE_URL).href)
    : null;

  return { items, nextUrl };
}

/** Парсит полный текст отдельной статьи */
async function parseArticle(articleUrl: string): Promise<{ body: string; imageUrl?: string; date?: string }> {
  let cheerio: typeof import("cheerio");
  try {
    cheerio = await import("cheerio");
  } catch {
    return { body: "" };
  }

  const html = await fetchHtml(articleUrl);
  const $ = cheerio.load(html);

  const body = $(SELECTORS.articleBody).first().text().trim();
  const dateRaw = $(SELECTORS.articleDate).first().attr("datetime")
    ?? $(SELECTORS.articleDate).first().text().trim();
  const imgSrc = $(SELECTORS.articleImage).first().attr("src");
  const imageUrl = imgSrc
    ? (imgSrc.startsWith("http") ? imgSrc : new URL(imgSrc, BASE_URL).href)
    : undefined;

  return { body, imageUrl, date: dateRaw || undefined };
}

/** Парсит дату из строки (поддерживает разные форматы) */
function parseDate(raw?: string): Date | null {
  if (!raw) return null;
  // ISO
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  // Русский формат "12 марта 2024"
  const months: Record<string, number> = {
    "января": 0, "февраля": 1, "марта": 2, "апреля": 3,
    "мая": 4, "июня": 5, "июля": 6, "августа": 7,
    "сентября": 8, "октября": 9, "ноября": 10, "декабря": 11,
  };
  const m = raw.match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i);
  if (m) {
    const month = months[m[2].toLowerCase()];
    if (month !== undefined) return new Date(parseInt(m[3]), month, parseInt(m[1]));
  }
  return null;
}

async function main() {
  console.log(`Парсинг новостей с ${BASE_URL}...\n`);

  let currentUrl: string | null = `${BASE_URL}${NEWS_LIST_PATH}`;
  let page = 0;
  let added = 0;
  let skipped = 0;
  let errors = 0;
  const allItems: NewsItem[] = [];

  // 1. Собираем список новостей со всех страниц
  while (currentUrl && page < MAX_PAGES) {
    page++;
    console.log(`  Страница ${page}: ${currentUrl}`);
    try {
      const { items, nextUrl } = await parseNewsList(currentUrl);
      if (items.length === 0) {
        console.log(`    Новостей не найдено. Проверьте CSS-селектор SELECTORS.newsCard`);
        break;
      }
      allItems.push(...items);
      currentUrl = nextUrl;
      await new Promise((r) => setTimeout(r, 500)); // вежливая пауза
    } catch (err) {
      console.error(`    Ошибка загрузки страницы: ${err}`);
      break;
    }
  }

  console.log(`\nНайдено ${allItems.length} новостей. Импорт...\n`);

  // 2. Для каждой новости: проверяем дедупликацию и импортируем
  for (const item of allItems) {
    // Дедупликация
    const existing = await db
      .select({ id: news.id })
      .from(news)
      .where(eq(news.sourceUrl, item.sourceUrl));

    if (existing.length > 0) {
      console.log(`  пропущена (уже есть): ${item.title}`);
      skipped++;
      continue;
    }

    try {
      // Получаем полный текст статьи
      let body = "";
      let coverImageId: number | undefined;
      let publishedAt: Date | null = parseDate(item.date);

      try {
        const article = await parseArticle(item.sourceUrl);
        body = article.body || item.title;
        if (!publishedAt) publishedAt = parseDate(article.date);

        // Скачиваем обложку
        const imgUrl = article.imageUrl ?? item.imageUrl;
        if (imgUrl) {
          const localUrl = await downloadImage(imgUrl);
          if (localUrl) {
            const fileId = await registerFile(localUrl, path.basename(localUrl));
            if (fileId) coverImageId = fileId;
          }
        }
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.warn(`    ⚠ не удалось загрузить статью: ${err}`);
        body = item.title;
      }

      // Генерируем уникальный slug
      let slug = generateSlug(item.title);
      if (!slug) slug = `news-${Date.now()}`;

      // Проверяем уникальность slug
      const slugExists = await db.select({ id: news.id }).from(news).where(eq(news.slug, slug));
      if (slugExists.length > 0) slug = `${slug}-${Date.now()}`;

      // Контент в формате Tiptap
      const content = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: body || item.title }],
          },
        ],
      };

      await db.insert(news).values({
        title: item.title,
        slug,
        content,
        status: "published",
        sourceUrl: item.sourceUrl,
        publishedAt: publishedAt ?? new Date(),
        coverImageId,
      });

      console.log(`  ✓ импортирована: ${item.title}`);
      added++;
    } catch (err) {
      console.error(`  ✗ ошибка: ${item.title}`, err);
      errors++;
    }
  }

  console.log(`\nГотово: добавлено ${added}, пропущено ${skipped}, ошибок ${errors}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
