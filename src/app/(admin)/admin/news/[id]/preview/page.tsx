import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { renderTiptap } from "@/lib/utils/tiptap-render";
import { ArrowLeft, Calendar, Tag, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function NewsPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const item = await db.query.news.findFirst({
    where: eq(news.id, id),
    with: {
      author: { columns: { name: true } },
      coverImage: { columns: { url: true, altText: true } },
    },
  });

  if (!item) notFound();

  const html = renderTiptap(item.content);

  return (
    <div className="min-h-screen bg-[#F7FAFD]">
      {/* Панель предпросмотра */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DDE8F0] bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/news/${id}/edit`}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Редактировать
            </Link>
          </Button>
          <Badge variant={item.status === "published" ? "default" : "secondary"}>
            {item.status === "published" ? "Опубликовано" : "Черновик"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-400">Предпросмотр — так выглядит на сайте</p>
          {item.status === "published" && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/news/${item.slug}`} target="_blank">
                <Globe className="mr-1.5 h-4 w-4" />
                Открыть на сайте
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Имитация публичной страницы */}
      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
        {/* Обложка */}
        {(item as typeof item & { coverImage?: { url: string; altText?: string | null } | null }).coverImage?.url && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(item as typeof item & { coverImage?: { url: string } | null }).coverImage!.url}
              alt={item.title}
              className="h-[400px] w-full object-cover"
            />
          </div>
        )}

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
            {(item as typeof item & { author?: { name: string } | null }).author?.name && (
              <div className="flex items-center gap-1.5">
                <span>Автор:</span>
                <span className="font-semibold text-[#4B6075]">
                  {(item as typeof item & { author?: { name: string } | null }).author!.name}
                </span>
              </div>
            )}
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-[#8B9BAD]" />
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#DDE8F0] px-2.5 py-0.5 text-xs font-semibold text-[#4B6075]"
                >
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
    </div>
  );
}
