import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { renderTiptap } from "@/lib/utils/tiptap-render";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateStaticParams() {
  const items = await db.query.news.findMany({
    where: eq(news.status, "published"),
    columns: { slug: true },
    limit: 100,
  });
  return items.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await db.query.news.findFirst({
    where: and(eq(news.slug, slug), eq(news.status, "published")),
    columns: { title: true, seoTitle: true, seoDescription: true, excerpt: true },
  });
  if (!item) return { title: "Новость не найдена" };
  return {
    title: item.seoTitle || item.title,
    description: item.seoDescription || item.excerpt || undefined,
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const item = await db.query.news.findFirst({
    where: and(eq(news.slug, slug), eq(news.status, "published")),
    with: { author: { columns: { name: true } } },
  });

  if (!item) notFound();

  const html = renderTiptap(item.content);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Хлебные крошки */}
      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-[#00E5C0] mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к новостям
      </Link>

      {/* Шапка */}
      <div className="mb-8">
        {item.category && (
          <span className="inline-block text-[#00E5C0] text-[10px] font-black uppercase tracking-widest mb-4">
            #{item.category}
          </span>
        )}
        <h1 className="heading-display text-3xl lg:text-4xl text-white leading-tight">
          {item.title}
        </h1>
        {item.excerpt && (
          <p className="mt-4 text-lg text-white/40 leading-relaxed">{item.excerpt}</p>
        )}

        {/* Мета */}
        <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-white/10 text-sm text-white/30">
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
          {item.author?.name && (
            <div className="flex items-center gap-1.5">
              <span className="text-white/20">Автор:</span>
              {item.author.name}
            </div>
          )}
        </div>

        {/* Теги */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Tag className="h-4 w-4 text-white/20" />
            {item.tags.map((tag) => (
              <span key={tag} className="text-xs text-white/20 font-bold">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Контент */}
      {html ? (
        <article
          className="prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="text-white/25 italic">Содержимое не добавлено</p>
      )}
    </div>
  );
}
