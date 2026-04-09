/**
 * POST /api/v1/ai/query
 * RAG-ответчик: Meilisearch-поиск → DeepSeek LLM
 *
 * Body:   { question: string }
 * Returns: { answer, sources, question, model, configured }
 *
 * Env:
 *   DEEPSEEK_API_KEY  — ключ DeepSeek
 *   DEEPSEEK_MODEL    — модель (deepseek-chat по умолчанию)
 *   API_SECRET_KEY    — защита эндпоинта (опционально)
 *
 * SECURITY: таблица users (логины/пароли) намеренно исключена из поиска.
 */

import { NextRequest, NextResponse } from "next/server";
import { V1_HEADERS } from "@/lib/utils/api-key";
import { searchContent, SearchDoc } from "@/lib/search/meili";
import { chatCompletion, isConfigured } from "@/lib/ai/deepseek";
import { db } from "@/lib/db";
import { knowledgeItems, news, projects, partners, publications, documents, departments } from "@/lib/db/schema";
import { eq, ilike, and, or } from "drizzle-orm";
import { z } from "zod";

// ── Rate limit ───────────────────────────────────────────────────────────────
const aiRateMap = new Map<string, { count: number; ts: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60_000; // 1 минута
  const max = 5;
  const entry = aiRateMap.get(ip);
  if (!entry || now - entry.ts > window) {
    aiRateMap.set(ip, { count: 1, ts: now });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// ── Validation ───────────────────────────────────────────────────────────────
const schema = z.object({
  question: z.string().min(5, "Вопрос слишком короткий").max(500),
});

// ── Context retrieval ────────────────────────────────────────────────────────
type ContextItem = {
  title: string;
  slug: string;
  type: string;
  body: string;
};

type RetrieveResult = {
  items: ContextItem[];
  search_mode: "meili" | "meili+db" | "db_fallback";
};

async function retrieveContext(question: string): Promise<RetrieveResult> {
  // Попытка через Meilisearch (null = Meili недоступен, [] = нет результатов)
  const hits = await searchContent(question, { limit: 5 });

  if (hits !== null) {
    // Meilisearch ответил — используем его результаты (даже если пустые)
    if (hits.length > 0) {
      return {
        items: hits.map((h: SearchDoc) => ({
          title: h.title,
          slug: h.slug,
          type: h.type,
          body: h.body,
        })),
        search_mode: "meili",
      };
    }
    // Meili ответил 0 hits — дополняем через DB
    const dbItems = await dbFallbackSearch(question);
    return { items: dbItems, search_mode: dbItems.length > 0 ? "meili+db" : "meili" };
  }

  // Meilisearch недоступен — полный DB fallback
  const dbItems = await dbFallbackSearch(question);
  return { items: dbItems, search_mode: "db_fallback" };
}

/**
 * Полнотекстовый поиск по всем публичным таблицам.
 * SECURITY: таблица users намеренно исключена — никаких email/password/role.
 */
async function dbFallbackSearch(question: string): Promise<ContextItem[]> {
  const pattern = `%${question.slice(0, 60)}%`;
  const results: ContextItem[] = [];

  // Новости
  const newsResults = await db.query.news.findMany({
    where: and(
      eq(news.status, "published"),
      or(ilike(news.title, pattern), ilike(news.excerpt, pattern))!
    ),
    columns: { title: true, slug: true, excerpt: true },
    limit: 3,
  });
  results.push(...newsResults.map((i) => ({
    title: i.title, slug: i.slug, type: "news", body: i.excerpt ?? "",
  })));

  // База знаний
  const kbResults = await db.query.knowledgeItems.findMany({
    where: and(eq(knowledgeItems.status, "published"), ilike(knowledgeItems.title, pattern)),
    columns: { title: true, slug: true },
    limit: 2,
  });
  results.push(...kbResults.map((i) => ({ title: i.title, slug: i.slug, type: "knowledge", body: "" })));

  // Проекты
  const projectResults = await db.query.projects.findMany({
    where: or(ilike(projects.title, pattern), ilike(projects.description, pattern))!,
    columns: { title: true, slug: true, description: true, type: true, lead: true, duration: true },
    limit: 3,
  });
  results.push(...projectResults.map((i) => ({
    title: i.title,
    slug: i.slug,
    type: "project",
    body: [i.description, i.lead, i.duration].filter(Boolean).join(" | "),
  })));

  // Партнёры
  const partnerResults = await db.query.partners.findMany({
    where: or(ilike(partners.name, pattern), ilike(partners.description, pattern), ilike(partners.services, pattern))!,
    columns: { name: true, description: true, services: true, websiteUrl: true },
    limit: 3,
  });
  results.push(...partnerResults.map((i) => ({
    title: i.name,
    slug: "partners",
    type: "partner",
    body: [i.description, i.services].filter(Boolean).join(" | "),
  })));

  // Публикации
  const pubResults = await db.query.publications.findMany({
    where: or(ilike(publications.title, pattern), ilike(publications.abstract, pattern), ilike(publications.authors, pattern))!,
    columns: { title: true, authors: true, abstract: true, year: true, journal: true, doi: true },
    limit: 3,
  });
  results.push(...pubResults.map((i) => ({
    title: i.title,
    slug: "publications",
    type: "publication",
    body: [i.authors, i.year ? String(i.year) : null, i.journal, i.abstract?.slice(0, 200)].filter(Boolean).join(" | "),
  })));

  // Документы
  const docResults = await db.query.documents.findMany({
    where: and(eq(documents.status, "active"), ilike(documents.title, pattern)),
    columns: { title: true, section: true },
    limit: 2,
  });
  results.push(...docResults.map((i) => ({
    title: i.title,
    slug: "documents",
    type: "document",
    body: i.section ?? "",
  })));

  // Подразделения
  const deptResults = await db.query.departments.findMany({
    where: or(ilike(departments.name, pattern), ilike(departments.description, pattern))!,
    columns: { name: true, slug: true, description: true },
    limit: 2,
  });
  results.push(...deptResults.map((i) => ({
    title: i.name,
    slug: i.slug,
    type: "department",
    body: i.description ?? "",
  })));

  return results;
}

// ── Формирование URL источника по типу ───────────────────────────────────────
function sourceUrl(type: string, slug: string): string {
  switch (type) {
    case "news":        return `/news/${slug}`;
    case "knowledge":   return `/knowledge-base/${slug}`;
    case "project":     return `/research/${slug}`;
    case "partner":     return `/partners`;
    case "publication": return `/publications`;
    case "document":    return `/documents`;
    case "department":  return `/about`;
    default:            return `/${slug}`;
  }
}

// ── System prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(context: ContextItem[]): string {
  const TYPE_LABELS: Record<string, string> = {
    news: "Новость",
    knowledge: "База знаний",
    project: "Проект/исследование",
    partner: "Партнёр",
    publication: "Публикация",
    document: "Документ",
    department: "Подразделение",
    page: "Страница",
  };

  const contextText = context.length > 0
    ? context
        .map((c, i) =>
          `[${i + 1}] ${TYPE_LABELS[c.type] ?? c.type}: «${c.title}»\n${c.body ? c.body.slice(0, 400) : "(нет описания)"}`
        )
        .join("\n\n")
    : "Релевантных материалов не найдено.";

  return `Ты — ИИ-помощник Арктического научно-исследовательского центра Республики Саха (Якутия), АНИЦ.
Отвечай на вопросы пользователей, опираясь на предоставленный контекст из материалов сайта.
Если ответ не содержится в контексте, честно скажи об этом и порекомендуй обратиться на info@anic.ru.
Отвечай кратко, чётко и на русском языке. Не упоминай технические детали (базы данных, таблицы, поиск).

Контекст из материалов АНИЦ:
${contextText}`;
}

// ── Handlers ─────────────────────────────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: V1_HEADERS });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте через минуту." },
      { status: 429, headers: V1_HEADERS }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: V1_HEADERS }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400, headers: V1_HEADERS }
    );
  }

  const { question } = parsed.data;

  // Если DeepSeek не настроен — вернуть понятный ответ без краша
  if (!isConfigured()) {
    return NextResponse.json(
      {
        answer: "Модуль ИИ-ответов временно недоступен. Обратитесь напрямую на info@anic.ru.",
        sources: [],
        question,
        configured: false,
        model: null,
      },
      { status: 200, headers: V1_HEADERS }
    );
  }

  // Поиск релевантного контекста
  const { items: context, search_mode } = await retrieveContext(question);

  // Вызов DeepSeek
  const answer = await chatCompletion(
    [
      { role: "system", content: buildSystemPrompt(context) },
      { role: "user", content: question },
    ],
    { maxTokens: 800, temperature: 0.3 }
  );

  if (!answer) {
    return NextResponse.json(
      { error: "Ошибка обращения к ИИ. Попробуйте позже." },
      { status: 502, headers: V1_HEADERS }
    );
  }

  const sources = context.map((c) => ({
    title: c.title,
    url: sourceUrl(c.type, c.slug),
    type: c.type,
  }));

  return NextResponse.json(
    {
      answer,
      sources,
      question,
      configured: true,
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      search_mode,
    },
    { status: 200, headers: V1_HEADERS }
  );
}
