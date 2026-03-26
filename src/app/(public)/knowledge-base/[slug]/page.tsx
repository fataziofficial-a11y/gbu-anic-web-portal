import { db } from "@/lib/db";
import { knowledgeItems } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { renderTiptap } from "@/lib/utils/tiptap-render";
import { ArrowLeft, Tag, Calendar, Building2, BookOpen, FileText } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateStaticParams() {
  const items = await db.query.knowledgeItems.findMany({
    where: eq(knowledgeItems.status, "published"),
    columns: { slug: true },
    limit: 200,
  });
  return items.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await db.query.knowledgeItems.findFirst({
    where: and(eq(knowledgeItems.slug, slug), eq(knowledgeItems.status, "published")),
    columns: { title: true },
  });
  if (!item) return { title: "Материал не найден" };
  return { title: item.title };
}

export default async function KnowledgeItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const item = await db.query.knowledgeItems.findFirst({
    where: and(eq(knowledgeItems.slug, slug), eq(knowledgeItems.status, "published")),
    with: {
      category: true,
      department: { columns: { name: true, slug: true } },
      author: { columns: { name: true } },
    },
  });

  if (!item) notFound();

  const related = item.categoryId
    ? await db.query.knowledgeItems.findMany({
        where: and(
          eq(knowledgeItems.status, "published"),
          eq(knowledgeItems.categoryId, item.categoryId),
          ne(knowledgeItems.id, item.id)
        ),
        limit: 4,
        columns: { id: true, title: true, slug: true },
        with: { category: { columns: { name: true } } },
      })
    : [];

  const html = renderTiptap(item.content);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Main content */}
        <div className="lg:col-span-3">
          <nav className="mb-8 flex items-center gap-2 text-sm text-[#8B9BAD]">
            <Link href="/knowledge-base" className="inline-flex items-center gap-1.5 font-semibold text-[#1A3A6B] transition hover:text-[#5CAFD6]">
              <ArrowLeft className="h-4 w-4" />
              База знаний
            </Link>
            {item.category && (
              <>
                <span>/</span>
                <Link
                  href={`/knowledge-base?category=${item.category.slug}`}
                  className="transition hover:text-[#1A3A6B]"
                >
                  {item.category.name}
                </Link>
              </>
            )}
          </nav>

          <div className="mb-10">
            {item.category && (
              <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.12em] text-[#5CAFD6]">
                {item.category.name}
              </span>
            )}
            <h1 className="text-3xl font-black leading-tight text-[#0D1C2E]">{item.title}</h1>

            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[#DDE8F0] pt-6 text-sm text-[#8B9BAD]">
              {item.publishedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#5CAFD6]" />
                  {new Date(item.publishedAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
              {item.department && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[#5CAFD6]" />
                  <Link
                    href={`/research/departments/${item.department.slug}`}
                    className="font-semibold text-[#4B6075] transition hover:text-[#1A3A6B]"
                  >
                    {item.department.name}
                  </Link>
                </div>
              )}
              {item.author && <span>Автор: <span className="font-semibold text-[#4B6075]">{item.author.name}</span></span>}
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Tag className="h-4 w-4 text-[#8B9BAD]" />
                {item.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[#DDE8F0] px-2.5 py-0.5 text-xs font-semibold text-[#4B6075]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {html ? (
            <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="italic text-[#8B9BAD]">Содержимое не добавлено</p>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-[#DDE8F0] bg-white p-5">
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8B9BAD]">
              <FileText className="h-3.5 w-3.5" />
              О материале
            </p>
            <dl className="space-y-3 text-sm">
              {item.category && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-[#8B9BAD]">Категория</dt>
                  <dd className="mt-0.5 font-semibold text-[#0D1C2E]">{item.category.name}</dd>
                </div>
              )}
              {item.department && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-[#8B9BAD]">Подразделение</dt>
                  <dd className="mt-0.5 font-semibold text-[#0D1C2E]">{item.department.name}</dd>
                </div>
              )}
              {item.author && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-[#8B9BAD]">Автор</dt>
                  <dd className="mt-0.5 font-semibold text-[#0D1C2E]">{item.author.name}</dd>
                </div>
              )}
              {item.publishedAt && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-[#8B9BAD]">Дата публикации</dt>
                  <dd className="mt-0.5 font-semibold text-[#0D1C2E]">
                    {new Date(item.publishedAt).toLocaleDateString("ru-RU")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {related.length > 0 && (
            <div className="rounded-2xl border border-[#DDE8F0] bg-white p-5">
              <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8B9BAD]">
                <BookOpen className="h-3.5 w-3.5" />
                Читайте также
              </p>
              <ul className="space-y-3">
                {related.map((rel) => (
                  <li key={rel.id}>
                    <Link
                      href={`/knowledge-base/${rel.slug}`}
                      className="block text-sm leading-snug text-[#4B6075] transition hover:text-[#1A3A6B]"
                    >
                      {rel.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
