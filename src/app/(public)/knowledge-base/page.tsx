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
          <p className="text-[#00E5C0]/50 text-xs font-bold tracking-[0.2em] uppercase mb-3">
            Библиотека
          </p>
          <h1 className="heading-display text-4xl lg:text-5xl text-white mb-4">База знаний</h1>
          <p className="text-white/40 text-lg max-w-2xl">
            Научные статьи, методические материалы и результаты арктических исследований
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="card-dark p-5 sticky top-24">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5" />
                Категории
              </p>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/knowledge-base"
                    className={`flex items-center gap-2 px-3 py-2 text-sm transition-all ${
                      !categorySlug
                        ? "text-[#00E5C0] font-bold"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {!categorySlug && <span className="w-1.5 h-px bg-[#00E5C0] flex-shrink-0" />}
                    Все ({items.length})
                  </Link>
                </li>
                {cats.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/knowledge-base?category=${cat.slug}`}
                      className={`flex items-center gap-2 px-3 py-2 text-sm transition-all ${
                        categorySlug === cat.slug
                          ? "text-[#00E5C0] font-bold"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      {categorySlug === cat.slug && (
                        <span className="w-1.5 h-px bg-[#00E5C0] flex-shrink-0" />
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
                <h2 className="heading-display text-2xl text-white">{selectedCat.name}</h2>
                {selectedCat.description && (
                  <p className="text-white/35 mt-1.5">{selectedCat.description}</p>
                )}
              </div>
            )}

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-white/5 flex items-center justify-center mb-5">
                  <BookOpen className="h-8 w-8 text-white/20" />
                </div>
                <p className="text-white/40 text-lg font-bold uppercase tracking-wider">Материалов пока нет</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/knowledge-base/${item.slug}`}
                    className="group card-dark p-6 flex items-start gap-4 block"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-white/5 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white/20 group-hover:text-[#00E5C0] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-white leading-snug group-hover:text-[#00E5C0] transition-colors">
                          {item.title}
                        </h3>
                        {item.category && (
                          <span className="inline-block text-[10px] font-black uppercase tracking-wider text-[#00E5C0] border border-[#00E5C0]/20 px-2 py-0.5 flex-shrink-0">
                            {item.category.name}
                          </span>
                        )}
                      </div>
                      {item.department && (
                        <p className="text-xs text-white/25 mt-1">{item.department.name}</p>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                          <Tag className="h-3 w-3 text-white/15 flex-shrink-0" />
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-[10px] text-white/20 font-bold">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.publishedAt && (
                        <p className="text-xs text-white/20 mt-3 font-bold">
                          {new Date(item.publishedAt).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      )}
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
