import { db } from "@/lib/db";
import { mediaItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink, Film } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300;

function getVideoEmbed(url: string): string | null {
  if (!url) return null;
  if (url.includes("rutube.ru/play/embed/")) return url.endsWith("/") ? url : `${url}/`;
  if (url.includes("vk.com/video_ext.php")) return url;
  const rutubeMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
  if (rutubeMatch) return `https://rutube.ru/play/embed/${rutubeMatch[1]}/`;
  const vkMatch = url.match(/vk\.com\/video(-?\d+_\d+)/);
  if (vkMatch) return `https://vk.com/video_ext.php?oid=${vkMatch[1].split("_")[0]}&id=${vkMatch[1].split("_")[1]}&hd=2`;
  return null;
}

function getSourceUrl(url: string): string | null {
  if (!url) return null;
  // Convert embed URL back to video page
  const rutubeEmbed = url.match(/rutube\.ru\/play\/embed\/([a-f0-9]+)/i);
  if (rutubeEmbed) return `https://rutube.ru/video/${rutubeEmbed[1]}/`;
  const rutubePage = url.match(/rutube\.ru\/video\//);
  if (rutubePage) return url;
  if (url.includes("vk.com")) return url;
  return url;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await db.query.mediaItems.findFirst({
    where: eq(mediaItems.id, Number(id)),
    columns: { title: true, description: true },
  });
  if (!item) return { title: "Медиа не найден" };
  return {
    title: item.title,
    description: item.description ?? undefined,
  };
}

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await db.query.mediaItems.findFirst({
    where: eq(mediaItems.id, Number(id)),
    with: { thumbnail: true },
  });

  if (!item || item.status !== "published") notFound();

  const embedUrl = item.videoUrl ? getVideoEmbed(item.videoUrl) : null;
  const sourceUrl = item.videoUrl ? getSourceUrl(item.videoUrl) : null;

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10 sm:px-6">
      {/* Навигация */}
      <Link
        href="/media"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#4B6075] transition hover:text-[#1A3A6B]"
      >
        <ArrowLeft className="h-4 w-4" />
        Все материалы
      </Link>

      {/* Видео */}
      {embedUrl ? (
        <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <iframe
            src={embedUrl}
            className="h-full w-full"
            allowFullScreen
            allow="autoplay; encrypted-media"
            frameBorder="0"
          />
        </div>
      ) : item.thumbnail ? (
        <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-2xl bg-[#F0F4F8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnail.url}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="mb-8 flex aspect-video w-full items-center justify-center rounded-2xl bg-[#EEF4FB]">
          <Film className="h-16 w-16 text-[#1A3A6B]/20" />
        </div>
      )}

      {/* Мета */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#1A3A6B]">
          {item.type === "video" ? "Видео" : "Фотоотчёт"}
        </span>
        {item.eventDate && (
          <span className="flex items-center gap-1.5 text-sm text-[#8B9BAD]">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(item.eventDate).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Заголовок */}
      <h1 className="mb-4 text-2xl font-bold leading-tight text-[#0D1C2E] sm:text-3xl">
        {item.title}
      </h1>

      {/* Описание */}
      {item.description && (
        <div className="mb-8 whitespace-pre-line text-base leading-relaxed text-[#4B6075]">
          {item.description}
        </div>
      )}

      {/* Ссылка на источник */}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-[#DDE8F0] bg-white px-5 py-3 text-sm font-medium text-[#1A3A6B] transition hover:border-[#1A3A6B] hover:bg-[#EEF4FB]"
        >
          <ExternalLink className="h-4 w-4" />
          Смотреть на {sourceUrl.includes("rutube") ? "Rutube" : sourceUrl.includes("vk.com") ? "VK Видео" : "источнике"}
        </a>
      )}
    </div>
  );
}
