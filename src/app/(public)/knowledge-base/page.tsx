import { db } from "@/lib/db";
import { knowledgeItems, kbCategories } from "@/lib/db/schema";
import { eq, desc, and, SQL } from "drizzle-orm";
import Link from "next/link";
import { BookOpen, Tag, FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import { PageBanner } from "@/components/public/PageBanner";

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
    ? await db.query.kbCategories.findFirst({ where: eq(kbCategories.slug, categorySlug) })
    : null;

  const conditions: SQL[] = [eq(knowledgeItems.status, "published")];
  if (selectedCat) conditions.push(eq(knowledgeItems.categoryId, selectedCat.id));
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
      <PageBanner
        eyebrow="Библиотека"
        title="База знаний"
        description="Научные статьи, методические материалы и результаты арктических исследований"
      />

      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-[#DDE8F0] bg-white p-5">
              <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8B9BAD]">
                <FolderOpen className="h-3.5 w-3.5" />
                Категории
              </p>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/knowledge-base"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      !categorySlug
                        ? "bg-[#EEF4FB] font-bold text-[#1A3A6B]"
                        : "text-[#4B6075] hover:bg-[#F7FAFD] hover:text-[#1A3A6B]"
                    }`}
                  >
                    Все ({items.length})
                  </Link>
                </li>
                {cats.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/knowledge-base?category=${cat.slug}`}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        categorySlug === cat.slug
                          ? "bg-[#EEF4FB] font-bold text-[#1A3A6B]"
                          : "text-[#4B6075] hover:bg-[#F7FAFD] hover:text-[#1A3A6B]"
                      }`}
                    >
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
                <h2 className="text-2xl font-black text-[#0D1C2E]">{selectedCat.name}</h2>
                {selectedCat.description && (
                  <p className="mt-1.5 text-[#4B6075]">{selectedCat.description}</p>
                )}
              </div>
            )}

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF4FB]">
                  <BookOpen className="h-8 w-8 text-[#1A3A6B]" />
                </div>
                <p className="text-lg font-bold text-[#4B6075]">Материалов пока нет</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/knowledge-base/${item.slug}`}
                    className="group flex items-start gap-4 rounded-2xl border border-[#DDE8F0] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B] transition group-hover:bg-[#1A3A6B] group-hover:text-white">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold leading-snug text-[#0D1C2E] transition-colors group-hover:text-[#1A3A6B]">
                          {item.title}
                        </h3>
                        {item.category && (
                          <span className="shrink-0 rounded-full border border-[#DDE8F0] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5CAFD6]">
                            {item.category.name}
                          </span>
                        )}
                      </div>
                      {item.department && (
                        <p className="mt-1 text-xs text-[#8B9BAD]">{item.department.name}</p>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <Tag className="h-3 w-3 shrink-0 text-[#8B9BAD]" />
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-[10px] font-semibold text-[#8B9BAD]">#{tag}</span>
                          ))}
                        </div>
                      )}
                      {item.publishedAt && (
                        <p className="mt-3 text-xs font-semibold text-[#8B9BAD]">
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
