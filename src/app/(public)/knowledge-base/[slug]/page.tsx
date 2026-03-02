import { db } from "@/lib/db";
import { knowledgeItems, kbCategories } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { renderTiptap } from "@/lib/utils/tiptap-render";
import { ArrowLeft, Tag, Calendar, Building2, BookOpen, FileText, Download } from "lucide-react";
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

  // Похожие материалы из той же категории
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Основной контент */}
        <div className="lg:col-span-3">
          {/* Хлебные крошки */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/knowledge-base" className="hover:text-gray-700 flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              База знаний
            </Link>
            {item.category && (
              <>
                <span>/</span>
                <Link
                  href={`/knowledge-base?category=${item.category.slug}`}
                  className="hover:text-gray-700"
                >
                  {item.category.name}
                </Link>
              </>
            )}
          </nav>

          {/* Заголовок */}
          <div className="mb-8">
            {item.category && (
              <Badge variant="secondary" className="mb-4">
                {item.category.name}
              </Badge>
            )}
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{item.title}</h1>

            {/* Мета */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
              {item.publishedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(item.publishedAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
              {item.department && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <Link
                    href={`/research/departments/${item.department.slug}`}
                    className="hover:text-blue-600"
                  >
                    {item.department.name}
                  </Link>
                </div>
              )}
              {item.author && (
                <span>Автор: {item.author.name}</span>
              )}
            </div>

            {/* Теги */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Tag className="h-4 w-4 text-gray-400" />
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Контент */}
          {html ? (
            <article
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-gray-400 italic">Содержимое не добавлено</p>
          )}
        </div>

        {/* Боковая панель */}
        <aside className="lg:col-span-1 space-y-6">
          {/* О материале */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              О материале
            </p>
            <dl className="space-y-3 text-sm">
              {item.category && (
                <div>
                  <dt className="text-xs text-gray-500 font-medium">Категория</dt>
                  <dd className="text-gray-900 mt-0.5">{item.category.name}</dd>
                </div>
              )}
              {item.department && (
                <div>
                  <dt className="text-xs text-gray-500 font-medium">Подразделение</dt>
                  <dd className="text-gray-900 mt-0.5">{item.department.name}</dd>
                </div>
              )}
              {item.author && (
                <div>
                  <dt className="text-xs text-gray-500 font-medium">Автор</dt>
                  <dd className="text-gray-900 mt-0.5">{item.author.name}</dd>
                </div>
              )}
              {item.publishedAt && (
                <div>
                  <dt className="text-xs text-gray-500 font-medium">Дата публикации</dt>
                  <dd className="text-gray-900 mt-0.5">
                    {new Date(item.publishedAt).toLocaleDateString("ru-RU")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Похожие материалы */}
          {related.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                Читайте также
              </p>
              <ul className="space-y-3">
                {related.map((rel) => (
                  <li key={rel.id}>
                    <Link
                      href={`/knowledge-base/${rel.slug}`}
                      className="text-sm text-gray-700 hover:text-blue-600 leading-snug block"
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
