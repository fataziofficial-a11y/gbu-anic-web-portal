/**
 * Полная переиндексация в Meilisearch.
 *
 * Запуск:
 *   pnpm tsx scripts/meili-reindex.ts
 *
 * Требует: MEILISEARCH_HOST и MEILISEARCH_API_KEY в .env (или окружении).
 * Читает данные напрямую через Drizzle (DATABASE_URL).
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { news, knowledgeItems, pages } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  configureIndex,
  newsDoc,
  knowledgeDoc,
  pageDoc,
} from "../src/lib/search/meili";
import { MeiliSearch } from "meilisearch";

const INDEX_NAME = "site_content";
const BATCH = 100;

async function main() {
  const host = process.env.MEILISEARCH_HOST;
  const key = process.env.MEILISEARCH_API_KEY;

  if (!host) {
    console.error("❌  MEILISEARCH_HOST не задан");
    process.exit(1);
  }

  const client = new MeiliSearch({ host, apiKey: key });
  const index = client.index(INDEX_NAME);

  console.log(`🔗  Подключение к Meilisearch: ${host}`);

  // Настройка индекса
  console.log("⚙️   Настройка индекса…");
  await configureIndex();

  // ── Новости ────────────────────────────────────────────────────────────────
  console.log("\n📰  Индексация новостей…");
  const newsItems = await db.query.news.findMany({
    where: eq(news.status, "published"),
    columns: { id: true, title: true, slug: true, excerpt: true, category: true, tags: true, publishedAt: true },
  });

  for (let i = 0; i < newsItems.length; i += BATCH) {
    const batch = newsItems.slice(i, i + BATCH).map(newsDoc);
    await index.addDocuments(batch, { primaryKey: "id" });
    console.log(`   ✓ ${Math.min(i + BATCH, newsItems.length)} / ${newsItems.length}`);
  }
  console.log(`   Итого: ${newsItems.length} новостей`);

  // ── База знаний ────────────────────────────────────────────────────────────
  console.log("\n📚  Индексация базы знаний…");
  const kbItems = await db.query.knowledgeItems.findMany({
    where: eq(knowledgeItems.status, "published"),
    columns: { id: true, title: true, slug: true, tags: true, publishedAt: true },
    with: { category: { columns: { name: true } } },
  });

  for (let i = 0; i < kbItems.length; i += BATCH) {
    const batch = kbItems.slice(i, i + BATCH).map(knowledgeDoc);
    await index.addDocuments(batch, { primaryKey: "id" });
    console.log(`   ✓ ${Math.min(i + BATCH, kbItems.length)} / ${kbItems.length}`);
  }
  console.log(`   Итого: ${kbItems.length} материалов`);

  // ── Страницы ───────────────────────────────────────────────────────────────
  console.log("\n📄  Индексация страниц…");
  const pageItems = await db.query.pages.findMany({
    where: eq(pages.status, "published"),
    columns: { id: true, title: true, slug: true, updatedAt: true },
  });

  for (let i = 0; i < pageItems.length; i += BATCH) {
    const batch = pageItems.slice(i, i + BATCH).map(pageDoc);
    await index.addDocuments(batch, { primaryKey: "id" });
    console.log(`   ✓ ${Math.min(i + BATCH, pageItems.length)} / ${pageItems.length}`);
  }
  console.log(`   Итого: ${pageItems.length} страниц`);

  const total = newsItems.length + kbItems.length + pageItems.length;
  console.log(`\n✅  Готово! Проиндексировано: ${total} документов`);
}

main().catch((err) => {
  console.error("❌  Ошибка:", err);
  process.exit(1);
});
