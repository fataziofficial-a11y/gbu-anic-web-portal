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
    <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
      <Link
        href="/news"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A3A6B] transition hover:text-[#5CAFD6]"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к новостям
      </Link>

      <div className="mb-10">
        {item.category && (
          <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.12em] text-[#5CAFD6]">
            {item.category}
          </span>
        )}
        <h1 className="text-3xl font-black leading-tight text-[#0D1C2E] lg:text-4xl">
          {item.title}
        </h1>
        {item.excerpt && (
          <p className="mt-4 text-lg leading-relaxed text-[#4B6075]">{item.excerpt}</p>
        )}

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
          {item.author?.name && (
            <div className="flex items-center gap-1.5">
              <span>Автор:</span>
              <span className="font-semibold text-[#4B6075]">{item.author.name}</span>
            </div>
          )}
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
        <article
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="italic text-[#8B9BAD]">Содержимое не добавлено</p>
      )}
    </div>
  );
}
