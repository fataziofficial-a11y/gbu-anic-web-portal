import Link from "next/link";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { news, knowledgeItems, pages } from "@/lib/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { searchContent } from "@/lib/search/meili";

/**
 * Поиск по сайту.
 *
 * Сначала спрашиваем поисковый движок; если он недоступен, ищем по базе
 * напрямую. Второй путь хуже по качеству (без морфологии), но лучше, чем
 * пустая страница: движок может быть остановлен, а сайт обязан искать.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Поиск по сайту — АНИЦ",
  description: "Поиск по новостям, страницам и базе знаний сайта АНИЦ",
};

const TYPE_LABEL: Record<string, string> = {
  news: "Новость",
  knowledge: "База знаний",
  page: "Страница",
  pages: "Страница",
};

function hrefFor(type: string, slug?: string | null): string {
  if (!slug) return "/";
  if (type === "news") return `/news/${slug}`;
  if (type === "knowledge") return `/knowledge-base/${slug}`;
  return `/${slug}`;
}

type Row = { type: string; title: string; slug: string | null; excerpt: string | null };

async function findAll(q: string): Promise<Row[]> {
  const hits = await searchContent(q, { limit: 30 });
  if (hits !== null) {
    return hits.map((h) => ({
      type: h.type,
      title: h.title,
      slug: h.slug ?? null,
      excerpt: h.body ? h.body.slice(0, 220) : null,
    }));
  }

  const pattern = `%${q}%`;
  const [n, k, p] = await Promise.all([
    db.select({ title: news.title, slug: news.slug, excerpt: news.excerpt })
      .from(news)
      .where(and(eq(news.status, "published"),
                 or(ilike(news.title, pattern), ilike(news.excerpt, pattern))))
      .limit(20),
    db.select({ title: knowledgeItems.title, slug: knowledgeItems.slug })
      .from(knowledgeItems)
      .where(ilike(knowledgeItems.title, pattern))
      .limit(10),
    db.select({ title: pages.title, slug: pages.slug })
      .from(pages)
      .where(ilike(pages.title, pattern))
      .limit(10),
  ]);
  return [
    ...n.map((r) => ({ type: "news", title: r.title, slug: r.slug, excerpt: r.excerpt ?? null })),
    ...k.map((r) => ({ type: "knowledge", title: r.title, slug: r.slug, excerpt: null })),
    ...p.map((r) => ({ type: "page", title: r.title, slug: r.slug, excerpt: null })),
  ];
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const tooShort = q.length > 0 && q.length < 2;
  const rows: Row[] = q.length >= 2 ? await findAll(q) : [];

  return (
    <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-[#060E18] sm:text-3xl">Поиск по сайту</h1>

      <form action="/search" method="get" role="search" className="mt-6">
        <label htmlFor="q" className="sr-only">Поисковый запрос</label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            autoFocus
            placeholder="Например: конкурс научный сотрудник"
            className="w-full border border-gray-300 py-3 pl-12 pr-4 text-base
                       focus:border-[#5CAFD6] focus:outline-none"
          />
        </div>
      </form>

      {tooShort && (
        <p className="mt-6 text-sm text-gray-500">Введите не менее двух символов.</p>
      )}

      {q.length >= 2 && (
        <>
          <p className="mt-6 text-sm text-gray-500">
            {rows.length === 0
              ? `По запросу «${q}» ничего не найдено`
              : `Найдено: ${rows.length}`}
          </p>

          <ul className="mt-4 divide-y divide-gray-200 border-t border-gray-200">
            {rows.map((r, i) => (
              <li key={`${r.type}-${r.slug}-${i}`} className="py-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5CAFD6]">
                  {TYPE_LABEL[r.type] ?? r.type}
                </span>
                <Link
                  href={hrefFor(r.type, r.slug)}
                  className="mt-1 block text-lg font-semibold text-[#060E18] hover:text-[#5CAFD6]"
                >
                  {r.title}
                </Link>
                {r.excerpt && (
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{r.excerpt}</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
