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
      <section className="border-b border-[#DDE8F0] bg-[#F7FAFD] py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Знания для всех</p>
          <h1 className="mt-2 text-4xl font-black text-[#0D1C2E] lg:text-5xl">Образовательный контент</h1>
          <p className="mt-3 max-w-xl text-lg text-[#4B6075]">
            Статьи, материалы и научно-популярные публикации центра
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/education"
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                !categorySlug
                  ? "bg-[#1A3A6B] text-white"
                  : "border border-[#DDE8F0] text-[#4B6075] hover:border-[#1A3A6B] hover:text-[#1A3A6B]"
              }`}
            >
              Все
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/education?category=${encodeURIComponent(cat.slug)}`}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  categoryId === cat.id
                    ? "bg-[#1A3A6B] text-white"
                    : "border border-[#DDE8F0] text-[#4B6075] hover:border-[#1A3A6B] hover:text-[#1A3A6B]"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF4FB]">
              <BookOpen className="h-8 w-8 text-[#1A3A6B]" />
            </div>
            <p className="text-lg font-bold text-[#4B6075]">Материалов пока нет</p>
            <p className="mt-1 text-sm text-[#8B9BAD]">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/knowledge-base/${item.slug}`}
                className="group flex min-h-[180px] flex-col justify-between rounded-2xl border border-[#DDE8F0] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <span className="mb-3 block text-xs font-bold uppercase tracking-[0.12em] text-[#5CAFD6]">
                    Статья
                  </span>
                  <h2 className="line-clamp-4 text-base font-bold leading-snug text-[#0D1C2E] transition-colors group-hover:text-[#1A3A6B]">
                    {item.title}
                  </h2>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {item.publishedAt && (
                    <p className="text-xs text-[#8B9BAD]">
                      {new Date(item.publishedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-[#5CAFD6] transition-colors group-hover:text-[#1A3A6B]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
