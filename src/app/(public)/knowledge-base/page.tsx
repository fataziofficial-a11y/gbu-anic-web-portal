import { db } from "@/lib/db";
import { knowledgeItems, kbCategories } from "@/lib/db/schema";
import { eq, desc, and, SQL } from "drizzle-orm";
import Link from "next/link";
import { BookOpen, Tag, FolderOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "База знаний" };
export const revalidate = 60;

export default async function KnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const categorySlug = sp.category ?? "";

  const selectedCat = categorySlug
    ? await db.query.kbCategories.findFirst({
        where: eq(kbCategories.slug, categorySlug),
      })
    : null;

  const conditions: SQL[] = [eq(knowledgeItems.status, "published")];
  if (selectedCat) {
    conditions.push(eq(knowledgeItems.categoryId, selectedCat.id));
  }
  const where = and(...conditions);

  const [items, cats] = await Promise.all([
    db.query.knowledgeItems.findMany({
      where,
      orderBy: [desc(knowledgeItems.publishedAt)],
      with: { category: { columns: { name: true, slug: true } }, department: { columns: { name: true } } },
      limit: 30,
    }),
    db.query.kbCategories.findMany({ orderBy: [desc(kbCategories.sortOrder)] }),
  ]);

  return (
    <div>
      <section className="arctic-page-header text-white py-20 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-glacial-light/50 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Библиотека
          </p>
          <h1 className="heading-serif text-4xl lg:text-5xl text-white mb-4">База знаний</h1>
          <p className="text-slate-300/70 text-lg max-w-2xl">
            Научные статьи, методические материалы и результаты арктических исследований
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sticky top-24">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5" />
                Категории
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/knowledge-base"
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                      !categorySlug
                        ? "bg-glacial/8 text-glacial-dark font-medium"
                        : "text-slate-600 hover:bg-frost-50"
                    }`}
                  >
                    {!categorySlug && <span className="w-1.5 h-1.5 rounded-full bg-glacial flex-shrink-0" />}
                    Все ({items.length})
                  </Link>
                </li>
                {cats.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/knowledge-base?category=${cat.slug}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                        categorySlug === cat.slug
                          ? "bg-glacial/8 text-glacial-dark font-medium"
                          : "text-slate-600 hover:bg-frost-50"
                      }`}
                    >
                      {categorySlug === cat.slug && (
                        <span className="w-1.5 h-1.5 rounded-full bg-glacial flex-shrink-0" />
                      )}
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            {selectedCat && (
              <div className="mb-8">
                <h2 className="heading-serif text-2xl text-arctic-900">{selectedCat.name}</h2>
                {selectedCat.description && (
                  <p className="text-slate-500 mt-1.5">{selectedCat.description}</p>
                )}
              </div>
            )}

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
                  <BookOpen className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 text-lg font-medium">Материалов пока нет</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/knowledge-base/${item.slug}`}
                    className="group block bg-white rounded-2xl border border-slate-200/80 p-6 card-hover accent-border-hover"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-glacial/8 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-glacial" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-arctic-900 leading-snug group-hover:text-glacial-dark transition-colors">
                            {item.title}
                          </h3>
                          {item.category && (
                            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-glacial bg-glacial/8 px-2 py-0.5 rounded-md flex-shrink-0">
                              {item.category.name}
                            </span>
                          )}
                        </div>
                        {item.department && (
                          <p className="text-xs text-slate-500 mt-1">{item.department.name}</p>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-3">
                            <Tag className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] text-slate-400 bg-frost-50 px-2 py-0.5 rounded-md border border-slate-100"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.publishedAt && (
                          <p className="text-xs text-slate-400 mt-3">
                            {new Date(item.publishedAt).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
