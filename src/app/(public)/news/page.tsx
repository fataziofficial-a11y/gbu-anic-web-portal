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
      <section className="arctic-page-header text-white py-16 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-glacial-light/50 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Центр новостей
          </p>
          <h1 className="heading-serif text-4xl lg:text-5xl text-white mb-3">Новости</h1>
          <p className="text-slate-300/70 text-lg max-w-xl">
            {q ? `Результаты поиска «${q}»: ${total}` : `Актуальные события и публикации центра`}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search + filters */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/news"
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                !category
                  ? "bg-[#00E5C0] text-[#050E1C]"
                  : "border border-white/10 text-white/40 hover:border-[#00E5C0]/30 hover:text-white"
              }`}
            >
              Все
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/news?category=${encodeURIComponent(cat)}`}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                  category === cat
                    ? "bg-[#00E5C0] text-[#050E1C]"
                    : "border border-white/10 text-white/40 hover:border-[#00E5C0]/30 hover:text-white"
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
            <div className="w-16 h-16 bg-white/5 flex items-center justify-center mb-5">
              <Newspaper className="h-8 w-8 text-white/20" />
            </div>
            <p className="text-white/40 text-lg font-bold uppercase tracking-wider">Новостей пока нет</p>
            <p className="text-sm text-white/20 mt-1">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => {
              const d = item.publishedAt ? new Date(item.publishedAt) : null;
              const dayMonth = d
                ? `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`
                : null;
              return (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group card-dark p-6 flex flex-col justify-between min-h-[200px] relative overflow-hidden"
                >
                  {dayMonth && (
                    <span className="absolute top-2 right-3 text-[64px] font-black text-white/[0.04] leading-none select-none pointer-events-none">
                      {dayMonth}
                    </span>
                  )}
                  <div>
                    {item.category && (
                      <span className="text-[#00E5C0] text-[10px] font-black uppercase tracking-widest mb-3 block">
                        #{item.category}
                      </span>
                    )}
                    <h2 className="font-bold text-white text-base leading-snug group-hover:text-[#00E5C0] transition-colors line-clamp-4">
                      {item.title}
                    </h2>
                    {item.excerpt && (
                      <p className="mt-2 text-sm text-white/30 line-clamp-2 leading-relaxed">{item.excerpt}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] text-white/20 font-bold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {dayMonth && (
                      <p className="text-white/20 text-xs font-bold ml-auto">{dayMonth}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-12">
            {page > 1 && (
              <Link
                href={`/news?page=${page - 1}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
                className="w-10 h-10 flex items-center justify-center border border-white/10 text-white/40 hover:border-[#00E5C0]/30 hover:text-white transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/news?page=${p}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
                className={`w-10 h-10 flex items-center justify-center text-sm font-black transition-all ${
                  p === page
                    ? "bg-[#00E5C0] text-[#050E1C]"
                    : "border border-white/10 text-white/40 hover:border-[#00E5C0]/30 hover:text-white"
                }`}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={`/news?page=${page + 1}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
                className="w-10 h-10 flex items-center justify-center border border-white/10 text-white/40 hover:border-[#00E5C0]/30 hover:text-white transition-all"
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
