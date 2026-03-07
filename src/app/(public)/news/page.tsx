import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { eq, desc, count, ilike, and, SQL } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import { NewsSearch } from "@/components/public/NewsSearch";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Новости" };
export const revalidate = 60;

const LIMIT = 12;

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const category = sp.category ?? "";
  const q = sp.q ?? "";
  const offset = (page - 1) * LIMIT;

  const conditions: SQL[] = [eq(news.status, "published")];
  if (category) conditions.push(eq(news.category, category));
  if (q) conditions.push(ilike(news.title, `%${q}%`));
  const where = and(...conditions);

  const [items, totalResult] = await Promise.all([
    db.query.news.findMany({
      where,
      orderBy: [desc(news.publishedAt)],
      limit: LIMIT,
      offset,
      columns: { id: true, title: true, slug: true, excerpt: true, category: true, publishedAt: true, tags: true },
    }),
    db.select({ count: count() }).from(news).where(where),
  ]);

  const total = Number(totalResult[0].count);
  const totalPages = Math.ceil(total / LIMIT);

  const allCats = await db
    .selectDistinct({ category: news.category })
    .from(news)
    .where(eq(news.status, "published"));
  const categories = allCats.map((r) => r.category).filter(Boolean) as string[];

  return (
    <div>
      {/* Page header */}
      <section className="border-b border-[#DDE8F0] bg-[#F7FAFD] py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Центр новостей</p>
          <h1 className="mt-2 text-4xl font-black text-[#0D1C2E] lg:text-5xl">Новости</h1>
          <p className="mt-3 text-lg text-[#4B6075]">
            {q ? `Результаты поиска «${q}»: ${total}` : "Актуальные события и публикации центра"}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
        {/* Search + filters */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/news"
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                !category
                  ? "bg-[#1A3A6B] text-white"
                  : "border border-[#DDE8F0] text-[#4B6075] hover:border-[#1A3A6B] hover:text-[#1A3A6B]"
              }`}
            >
              Все
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/news?category=${encodeURIComponent(cat)}`}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  category === cat
                    ? "bg-[#1A3A6B] text-white"
                    : "border border-[#DDE8F0] text-[#4B6075] hover:border-[#1A3A6B] hover:text-[#1A3A6B]"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
          <Suspense>
            <NewsSearch initialValue={q} />
          </Suspense>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF4FB]">
              <Newspaper className="h-8 w-8 text-[#1A3A6B]" />
            </div>
            <p className="text-lg font-bold text-[#4B6075]">Новостей пока нет</p>
            <p className="mt-1 text-sm text-[#8B9BAD]">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const d = item.publishedAt ? new Date(item.publishedAt) : null;
              const dateStr = d
                ? d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
                : null;
              return (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group flex flex-col rounded-2xl border border-[#DDE8F0] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {item.category && (
                    <span className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#5CAFD6]">
                      {item.category}
                    </span>
                  )}
                  <h2 className="flex-1 text-lg font-bold leading-snug text-[#0D1C2E] line-clamp-4 group-hover:text-[#1A3A6B] transition-colors">
                    {item.title}
                  </h2>
                  {item.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed text-[#4B6075] line-clamp-2">{item.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    {dateStr && <p className="text-xs text-[#8B9BAD]">{dateStr}</p>}
                    <p className="ml-auto text-xs font-semibold text-[#1A3A6B]">Читать →</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-1.5">
            {page > 1 && (
              <Link
                href={`/news?page=${page - 1}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDE8F0] text-[#4B6075] transition hover:border-[#1A3A6B] hover:text-[#1A3A6B]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/news?page=${p}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition ${
                  p === page
                    ? "bg-[#1A3A6B] text-white"
                    : "border border-[#DDE8F0] text-[#4B6075] hover:border-[#1A3A6B] hover:text-[#1A3A6B]"
                }`}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={`/news?page=${page + 1}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDE8F0] text-[#4B6075] transition hover:border-[#1A3A6B] hover:text-[#1A3A6B]"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
