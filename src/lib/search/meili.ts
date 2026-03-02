/**
 * Meilisearch client + helpers.
 *
 * Единый индекс "site_content" — все публичные сущности.
 * Поле `type`: "news" | "knowledge" | "page"
 *
 * Graceful degradation: если MEILISEARCH_HOST не задан, функции — no-op.
 */

import { MeiliSearch } from "meilisearch";
import { logger } from "@/lib/logger";

const INDEX_NAME = "site_content";

export type SearchDoc = {
  /** Уникальный ключ: "news_1", "kb_42", "page_7" */
  id: string;
  type: "news" | "knowledge" | "page";
  /** Числовой id в БД (для удаления) */
  numericId: number;
  title: string;
  slug: string;
  body: string; // excerpt / description / первые 500 символов
  tags: string[];
  category: string;
  publishedAt: number; // unix timestamp (seconds)
};

function getClient(): MeiliSearch | null {
  const host = process.env.MEILISEARCH_HOST;
  const key = process.env.MEILISEARCH_API_KEY;
  if (!host) return null;
  return new MeiliSearch({ host, apiKey: key });
}

async function getIndex() {
  const client = getClient();
  if (!client) return null;

  try {
    const index = client.index<SearchDoc>(INDEX_NAME);
    return index;
  } catch {
    return null;
  }
}

/** Первичная настройка индекса (вызывается из скрипта reindex). */
export async function configureIndex() {
  const client = getClient();
  if (!client) return;

  const index = client.index<SearchDoc>(INDEX_NAME);

  await index.updateSettings({
    searchableAttributes: ["title", "body", "tags", "category"],
    filterableAttributes: ["type", "publishedAt"],
    sortableAttributes: ["publishedAt"],
    displayedAttributes: ["id", "type", "numericId", "title", "slug", "body", "category", "tags", "publishedAt"],
    rankingRules: [
      "words",
      "typo",
      "proximity",
      "attribute",
      "sort",
      "exactness",
    ],
  });
}

/** Добавить / обновить документ в индексе. */
export async function upsertDoc(doc: SearchDoc): Promise<void> {
  const index = await getIndex();
  if (!index) return;
  try {
    await index.addDocuments([doc], { primaryKey: "id" });
  } catch (err) {
    logger.warn("Meili upsertDoc failed", { id: doc.id, err: String(err) });
  }
}

/** Удалить документ из индекса по составному id. */
export async function deleteDoc(docId: string): Promise<void> {
  const index = await getIndex();
  if (!index) return;
  try {
    await index.deleteDocument(docId);
  } catch (err) {
    logger.warn("Meili deleteDoc failed", { docId, err: String(err) });
  }
}

/** Поиск по всему индексу. */
export async function searchContent(
  query: string,
  opts: { type?: SearchDoc["type"]; limit?: number } = {}
): Promise<SearchDoc[] | null> {
  const client = getClient();
  if (!client) {
    logger.warn("Meili: no client (MEILISEARCH_HOST not set)");
    return null;
  }

  try {
    const index = client.index<SearchDoc>(INDEX_NAME);
    const { hits } = await index.search(query, {
      limit: opts.limit ?? 20,
      filter: opts.type ? `type = "${opts.type}"` : undefined,
      attributesToHighlight: ["title", "body"],
    });
    logger.info("Meili search OK", { query, hits: hits.length });
    return hits as SearchDoc[];
  } catch (err) {
    logger.warn("Meili search failed", { query, err: String(err) });
    return null;
  }
}

// ── Хелперы для формирования SearchDoc ────────────────────────────────────

export function newsDoc(item: {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  category?: string | null;
  tags?: string[] | null;
  publishedAt?: Date | null;
}): SearchDoc {
  return {
    id: `news_${item.id}`,
    type: "news",
    numericId: item.id,
    title: item.title,
    slug: item.slug,
    body: item.excerpt ?? "",
    category: item.category ?? "",
    tags: item.tags ?? [],
    publishedAt: item.publishedAt ? Math.floor(item.publishedAt.getTime() / 1000) : 0,
  };
}

export function knowledgeDoc(item: {
  id: number;
  title: string;
  slug: string;
  tags?: string[] | null;
  publishedAt?: Date | null;
  category?: { name: string } | null;
}): SearchDoc {
  return {
    id: `kb_${item.id}`,
    type: "knowledge",
    numericId: item.id,
    title: item.title,
    slug: item.slug,
    body: "",
    category: item.category?.name ?? "",
    tags: item.tags ?? [],
    publishedAt: item.publishedAt ? Math.floor(item.publishedAt.getTime() / 1000) : 0,
  };
}

export function pageDoc(item: {
  id: number;
  title: string;
  slug: string;
  updatedAt?: Date | null;
}): SearchDoc {
  return {
    id: `page_${item.id}`,
    type: "page",
    numericId: item.id,
    title: item.title,
    slug: item.slug,
    body: "",
    category: "",
    tags: [],
    publishedAt: item.updatedAt ? Math.floor(item.updatedAt.getTime() / 1000) : 0,
  };
}
