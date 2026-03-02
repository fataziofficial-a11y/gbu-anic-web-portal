import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { renderTiptap } from "@/lib/utils/tiptap-render";
import { ArrowLeft, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateStaticParams() {
  const items = await db.query.pages.findMany({
    where: eq(pages.status, "published"),
    columns: { slug: true },
  });
  return items.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.status, "published")),
    columns: { title: true, seoTitle: true, seoDescription: true },
  });
  if (!page) return { title: "Страница не найдена" };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.status, "published")),
    with: { author: { columns: { name: true } } },
  });

  if (!page) notFound();

  const html = renderTiptap(page.content);

  return (
    <div>
      {/* Page header */}
      <section className="arctic-page-header text-white py-16 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-glacial-light/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
          <h1 className="heading-serif text-4xl lg:text-5xl text-white">{page.title}</h1>
          {(page.updatedAt || page.createdAt) && (
            <div className="flex items-center gap-1.5 text-slate-300/60 text-sm mt-4">
              <Calendar className="h-4 w-4" />
              {new Date(page.updatedAt ?? page.createdAt!).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {html ? (
          <article
            className="prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-white/25 italic">Содержимое страницы не добавлено.</p>
        )}

        {page.author?.name && (
          <p className="mt-12 pt-6 border-t border-white/10 text-sm text-white/25">
            Материал подготовлен: {page.author.name}
          </p>
        )}
      </div>
    </div>
  );
}
