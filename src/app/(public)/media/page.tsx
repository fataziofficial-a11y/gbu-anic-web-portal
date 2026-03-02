import { db } from "@/lib/db";
import { mediaItems } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Film, Camera } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Медиа" };
export const revalidate = 60;

function getVideoEmbed(url: string): string | null {
  if (!url) return null;
  // Rutube: https://rutube.ru/video/ID/
  const rutubeMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
  if (rutubeMatch) return `https://rutube.ru/play/embed/${rutubeMatch[1]}/`;
  // VK video: https://vk.com/video-ID_ID или vk.com/video/
  const vkMatch = url.match(/vk\.com\/video(-?\d+_\d+)/);
  if (vkMatch) return `https://vk.com/video_ext.php?oid=${vkMatch[1].split("_")[0]}&id=${vkMatch[1].split("_")[1]}&hd=2`;
  return null;
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const typeFilter = sp.type ?? "";

  const where = typeFilter
    ? and(eq(mediaItems.status, "published"), eq(mediaItems.type, typeFilter))
    : eq(mediaItems.status, "published");

  const items = await db.query.mediaItems.findMany({
    where,
    orderBy: [desc(mediaItems.createdAt)],
    with: { thumbnail: true },
  });

  const tabs = [
    { label: "Все", value: "" },
    { label: "Видео", value: "video" },
    { label: "Фотоотчёты", value: "photo" },
  ];

  return (
    <div>
      <section className="arctic-page-header text-white py-16 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-glacial-light/50 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Медиацентр АНИЦ
          </p>
          <h1 className="heading-serif text-4xl lg:text-5xl text-white mb-3">Медиа</h1>
          <p className="text-slate-300/70 text-lg max-w-xl">
            Видеозаписи и фотоотчёты с мероприятий центра
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/media?type=${tab.value}` : "/media"}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                typeFilter === tab.value
                  ? "bg-glacial text-white shadow-sm"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:border-glacial/40 hover:text-glacial-dark"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <Film className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-lg font-medium">Материалов пока нет</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const embedUrl = item.videoUrl ? getVideoEmbed(item.videoUrl) : null;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden card-hover"
                >
                  {/* Media preview */}
                  {embedUrl ? (
                    <div className="relative w-full aspect-video bg-black">
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                        frameBorder="0"
                      />
                    </div>
                  ) : item.thumbnail ? (
                    <div className="relative w-full aspect-video bg-slate-100">
                      <Image
                        src={item.thumbnail.url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                      {item.type === "photo" && (
                        <div className="absolute top-2 right-2 bg-black/50 rounded-lg px-2 py-1 flex items-center gap-1">
                          <Camera className="h-3 w-3 text-white" />
                          <span className="text-white text-xs">Фото</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-slate-100 flex items-center justify-center">
                      <Film className="h-10 w-10 text-slate-300" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-glacial bg-glacial/8 px-2 py-0.5 rounded-md">
                        {item.type === "video" ? "Видео" : "Фотоотчёт"}
                      </span>
                      {item.eventDate && (
                        <span className="text-xs text-slate-400">{item.eventDate}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-arctic-900 leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
