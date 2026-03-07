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
      <section className="border-b border-[#DDE8F0] bg-[#F7FAFD] py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A3A6B] transition hover:text-[#5CAFD6]"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
          <h1 className="text-4xl font-black text-[#0D1C2E] lg:text-5xl">{page.title}</h1>
          {(page.updatedAt || page.createdAt) && (
            <div className="mt-4 flex items-center gap-1.5 text-sm text-[#8B9BAD]">
              <Calendar className="h-4 w-4 text-[#5CAFD6]" />
              {new Date(page.updatedAt ?? page.createdAt!).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
        {html ? (
          <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="italic text-[#8B9BAD]">Содержимое страницы не добавлено.</p>
        )}

        {page.author?.name && (
          <p className="mt-12 border-t border-[#DDE8F0] pt-6 text-sm text-[#8B9BAD]">
            Материал подготовлен: <span className="font-semibold text-[#4B6075]">{page.author.name}</span>
          </p>
        )}
      </div>
    </div>
  );
}
