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
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, V1_HEADERS } from "@/lib/utils/api-key";
import { searchContent, SearchDoc } from "@/lib/search/meili";
import { chatCompletion, isConfigured } from "@/lib/ai/deepseek";
import { db } from "@/lib/db";
import { knowledgeItems, news } from "@/lib/db/schema";
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

async function retrieveContext(question: string): Promise<ContextItem[]> {
  // Попытка через Meilisearch
  const hits = await searchContent(question, { limit: 5 });
  if (hits !== null && hits.length > 0) {
    return hits.map((h: SearchDoc) => ({
      title: h.title,
      slug: h.slug,
      type: h.type,
      body: h.body,
    }));
  }

  // Fallback: DB ilike поиск
  const pattern = `%${question.slice(0, 60)}%`;
  const results: ContextItem[] = [];

  const kbResults = await db.query.knowledgeItems.findMany({
    where: and(
      eq(knowledgeItems.status, "published"),
      ilike(knowledgeItems.title, pattern)
    ),
    columns: { title: true, slug: true },
    limit: 3,
  });
  results.push(...kbResults.map((i) => ({ title: i.title, slug: i.slug, type: "knowledge", body: "" })));

  const newsResults = await db.query.news.findMany({
    where: and(
      eq(news.status, "published"),
      or(ilike(news.title, pattern), ilike(news.excerpt, pattern))!
    ),
    columns: { title: true, slug: true, excerpt: true },
    limit: 2,
  });
  results.push(...newsResults.map((i) => ({ title: i.title, slug: i.slug, type: "news", body: i.excerpt ?? "" })));

  return results;
}

// ── System prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(context: ContextItem[]): string {
  const contextText = context.length > 0
    ? context
        .map((c, i) =>
          `[${i + 1}] ${c.type === "news" ? "Новость" : c.type === "knowledge" ? "База знаний" : "Страница"}: «${c.title}»\n${c.body ? c.body.slice(0, 400) : "(нет описания)"}`
        )
        .join("\n\n")
    : "Релевантных материалов не найдено.";

  return `Ты — ИИ-помощник Арктического научно-исследовательского центра Республики Саха (Якутия), АНИЦ.
Отвечай на вопросы пользователей, опираясь на предоставленный контекст из материалов сайта.
Если ответ не содержится в контексте, честно скажи об этом и порекомендуй обратиться на info@anic.ru.
Отвечай кратко, чётко и на русском языке.

Контекст из материалов АНИЦ:
${contextText}`;
}

// ── Handlers ─────────────────────────────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: V1_HEADERS });
}

export async function POST(req: NextRequest) {
  const deny = validateApiKey(req);
  if (deny) return deny;

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
  const context = await retrieveContext(question);

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
      {
        error: "Ошибка обращения к ИИ. Попробуйте позже.",
      },
      { status: 502, headers: V1_HEADERS }
    );
  }

  const sources = context.map((c) => ({
    title: c.title,
    url:
      c.type === "news"
        ? `/news/${c.slug}`
        : c.type === "knowledge"
        ? `/knowledge-base/${c.slug}`
        : `/${c.slug}`,
    type: c.type,
  }));

  return NextResponse.json(
    {
      answer,
      sources,
      question,
      configured: true,
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
    },
    { status: 200, headers: V1_HEADERS }
  );
}
