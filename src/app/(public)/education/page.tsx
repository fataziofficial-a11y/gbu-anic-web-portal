import { db } from "@/lib/db";
import { knowledgeItems, kbCategories } from "@/lib/db/schema";
import { eq, desc, and, ilike, SQL } from "drizzle-orm";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Образовательный контент" };
export const revalidate = 60;

export default async function EducationPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const categorySlug = sp.category ?? "";
  const q = sp.q ?? "";

  const conditions: SQL[] = [eq(knowledgeItems.status, "published")];
  if (q) conditions.push(ilike(knowledgeItems.title, `%${q}%`));

  let categoryId: number | undefined;
  if (categorySlug) {
    const cat = await db.query.kbCategories.findFirst({
      where: eq(kbCategories.slug, categorySlug),
    });
    if (cat) {
      categoryId = cat.id;
      conditions.push(eq(knowledgeItems.categoryId, cat.id));
    }
  }

  const [items, categories] = await Promise.all([
    db.query.knowledgeItems.findMany({
      where: and(...conditions),
      orderBy: [desc(knowledgeItems.publishedAt)],
      columns: { id: true, title: true, slug: true, metadata: true, publishedAt: true, categoryId: true },
    }),
    db.query.kbCategories.findMany({ orderBy: [kbCategories.name] }),
  ]);

  return (
    <div>
      <section className="arctic-page-header text-white py-16 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#00E5C0]/50 text-xs font-bold tracking-[0.2em] uppercase mb-3">
            Знания для всех
          </p>
          <h1 className="heading-display text-4xl lg:text-5xl text-white mb-3">
            Образовательный контент
          </h1>
          <p className="text-white/40 text-lg max-w-xl">
            Статьи, материалы и научно-популярные публикации центра
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/education"
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                !categorySlug
                  ? "bg-[#00E5C0] text-[#050E1C]"
                  : "border border-white/10 text-white/40 hover:border-[#00E5C0]/30 hover:text-white"
              }`}
            >
              Все
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/education?category=${encodeURIComponent(cat.slug)}`}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                  categoryId === cat.id
                    ? "bg-[#00E5C0] text-[#050E1C]"
                    : "border border-white/10 text-white/40 hover:border-[#00E5C0]/30 hover:text-white"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white/5 flex items-center justify-center mb-5">
              <BookOpen className="h-8 w-8 text-white/20" />
            </div>
            <p className="text-white/40 text-lg font-bold uppercase tracking-wider">Материалов пока нет</p>
            <p className="text-sm text-white/20 mt-1">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/knowledge-base/${item.slug}`}
                className="group card-dark p-6 flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <span className="text-[#00E5C0] text-[10px] font-black uppercase tracking-widest mb-3 block">
                    Статья
                  </span>
                  <h2 className="font-bold text-white text-base leading-snug group-hover:text-[#00E5C0] transition-colors line-clamp-4">
                    {item.title}
                  </h2>
                </div>
                <div className="flex items-center justify-between mt-4">
                  {item.publishedAt && (
                    <p className="text-white/20 text-xs font-bold">
                      {new Date(item.publishedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-[#00E5C0]/40 group-hover:text-[#00E5C0] transition-colors ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
