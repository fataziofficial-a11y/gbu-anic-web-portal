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
          <p className="text-[#00E5C0]/50 text-xs font-bold tracking-[0.2em] uppercase mb-3">
            Медиацентр АНИЦ
          </p>
          <h1 className="heading-display text-4xl lg:text-5xl text-white mb-3">Медиа</h1>
          <p className="text-white/40 text-lg max-w-xl">
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
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                typeFilter === tab.value
                  ? "bg-[#00E5C0] text-[#050E1C]"
                  : "border border-white/10 text-white/40 hover:border-[#00E5C0]/30 hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white/5 flex items-center justify-center mb-5">
              <Film className="h-8 w-8 text-white/20" />
            </div>
            <p className="text-white/40 text-lg font-bold uppercase tracking-wider">Материалов пока нет</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => {
              const embedUrl = item.videoUrl ? getVideoEmbed(item.videoUrl) : null;
              return (
                <div key={item.id} className="card-dark overflow-hidden">
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
                    <div className="relative w-full aspect-video bg-white/5">
                      <Image
                        src={item.thumbnail.url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                      {item.type === "photo" && (
                        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 flex items-center gap-1">
                          <Camera className="h-3 w-3 text-[#00E5C0]" />
                          <span className="text-white text-[10px] font-bold uppercase tracking-wider">Фото</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-white/5 flex items-center justify-center">
                      <Film className="h-10 w-10 text-white/10" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[#00E5C0] text-[10px] font-black uppercase tracking-widest">
                        {item.type === "video" ? "Видео" : "Фотоотчёт"}
                      </span>
                      {item.eventDate && (
                        <span className="text-white/20 text-xs font-bold">{item.eventDate}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-1.5 text-sm text-white/30 line-clamp-2 leading-relaxed">{item.description}</p>
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
