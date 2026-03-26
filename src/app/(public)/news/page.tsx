import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { eq, desc, count, ilike, and, SQL } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Newspaper, ChevronLeft, ChevronRight, Calendar, ArrowRight } from "lucide-react";
import { NewsSearch } from "@/components/public/NewsSearch";
import type { Metadata } from "next";
import { PageBanner } from "@/components/public/PageBanner";

export const metadata: Metadata = { title: "Новости" };
export const revalidate = 60;

const LIMIT = 10;

const CAT_LABELS: Record<string, string> = {
  news: "Новости",
  science: "Наука",
  events: "События",
  media: "Медиа",
};

// Gradient placeholders by index
const PLACEHOLDERS = [
  "from-[#1A3A6B] to-[#0D1C2E]",
  "from-[#5CAFD6] to-[#1A3A6B]",
  "from-[#2C5F8A] to-[#0D1C2E]",
  "from-[#0D4F8C] to-[#5CAFD6]",
  "from-[#1A3A6B] to-[#2C5F8A]",
];

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

  const [items, totalResult, allCats] = await Promise.all([
    db.query.news.findMany({
      where,
      orderBy: [desc(news.publishedAt)],
      limit: LIMIT,
      offset,
      columns: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        publishedAt: true,
        tags: true,
        coverImageId: true,
      },
      with: {
        coverImage: {
          columns: { url: true, altText: true },
        },
      },
    }),
    db.select({ count: count() }).from(news).where(where),
    db.selectDistinct({ category: news.category }).from(news).where(eq(news.status, "published")),
  ]);

  const total = Number(totalResult[0].count);
  const totalPages = Math.ceil(total / LIMIT);
  const categories = allCats.map((r) => r.category).filter(Boolean) as string[];

  return (
    <div>
      <PageBanner
        eyebrow="Центр новостей"
        title="Новости"
        description={q ? `Результаты поиска «${q}»: ${total}` : "Актуальные события и публикации центра"}
      />

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
                {CAT_LABELS[cat] ?? cat}
              </Link>
            ))}
          </div>
          <Suspense>
            <NewsSearch initialValue={q} />
          </Suspense>
        </div>

        {/* Count */}
        {total > 0 && (
          <p className="mb-6 text-sm text-[#8B9BAD]">
            Показано {offset + 1}–{Math.min(offset + LIMIT, total)} из {total} новостей
          </p>
        )}

        {/* News feed */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF4FB]">
              <Newspaper className="h-8 w-8 text-[#1A3A6B]" />
            </div>
            <p className="text-lg font-bold text-[#4B6075]">Новостей пока нет</p>
            <p className="mt-1 text-sm text-[#8B9BAD]">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#DDE8F0]">
            {items.map((item, idx) => {
              const d = item.publishedAt ? new Date(item.publishedAt) : null;
              const dateStr = d
                ? d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
                : null;
              const catLabel = item.category ? (CAT_LABELS[item.category] ?? item.category) : null;
              const placeholder = PLACEHOLDERS[idx % PLACEHOLDERS.length];
              const itemWithCover = item as typeof item & { coverImage?: { url: string; altText?: string | null } | null };
              const imageUrl = itemWithCover.coverImage?.url ?? null;

              return (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group flex gap-6 py-6 transition hover:bg-[#F7FAFD] -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-2xl"
                >
                  {/* Thumbnail */}
                  <div className="relative h-[130px] w-[200px] flex-none overflow-hidden rounded-xl sm:h-[150px] sm:w-[240px]">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={itemWithCover.coverImage?.altText ?? item.title}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="240px"
                      />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${placeholder}`}>
                        <Newspaper className="h-10 w-10 text-white/30" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {catLabel && (
                          <span className="rounded-full bg-[#EEF4FB] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1A3A6B]">
                            {catLabel}
                          </span>
                        )}
                        {dateStr && (
                          <span className="flex items-center gap-1 text-xs text-[#8B9BAD]">
                            <Calendar className="h-3 w-3" />
                            {dateStr}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-bold leading-snug text-[#0D1C2E] line-clamp-2 transition-colors group-hover:text-[#1A3A6B]">
                        {item.title}
                      </h2>
                      {item.excerpt && (
                        <p className="mt-1.5 text-sm leading-relaxed text-[#4B6075] line-clamp-2">
                          {item.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#5CAFD6] transition-colors group-hover:text-[#1A3A6B]">
                      Читать далее <ArrowRight className="h-3.5 w-3.5" />
                    </div>
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
                href={`/news?page=${page - 1}${category ? `&category=${encodeURIComponent(category)}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDE8F0] text-[#4B6075] transition hover:border-[#1A3A6B] hover:text-[#1A3A6B]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/news?page=${p}${category ? `&category=${encodeURIComponent(category)}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
                href={`/news?page=${page + 1}${category ? `&category=${encodeURIComponent(category)}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
