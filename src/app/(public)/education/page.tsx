import { db } from "@/lib/db";
import { knowledgeItems, kbCategories } from "@/lib/db/schema";
import { eq, desc, and, ilike, SQL } from "drizzle-orm";
import Link from "next/link";
import { BookOpen } from "lucide-react";
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
          <p className="text-glacial-light/50 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Знания для всех
          </p>
          <h1 className="heading-serif text-4xl lg:text-5xl text-white mb-3">
            Образовательный контент
          </h1>
          <p className="text-slate-300/70 text-lg max-w-xl">
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
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                !categorySlug
                  ? "bg-glacial text-white shadow-sm"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:border-glacial/40 hover:text-glacial-dark"
              }`}
            >
              Все
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/education?category=${encodeURIComponent(cat.slug)}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  categoryId === cat.id
                    ? "bg-glacial text-white shadow-sm"
                    : "bg-white border border-slate-200/80 text-slate-600 hover:border-glacial/40 hover:text-glacial-dark"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <BookOpen className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-lg font-medium">Материалов пока нет</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/knowledge-base/${item.slug}`}
                className="group block bg-white rounded-2xl border border-slate-200/80 overflow-hidden card-hover accent-border-hover p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-glacial" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-glacial">
                    Статья
                  </span>
                </div>
                <h2 className="font-semibold text-arctic-900 leading-snug group-hover:text-glacial-dark transition-colors line-clamp-3 text-lg">
                  {item.title}
                </h2>
                {item.publishedAt && (
                  <p className="mt-4 text-xs text-slate-400">
                    {new Date(item.publishedAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
