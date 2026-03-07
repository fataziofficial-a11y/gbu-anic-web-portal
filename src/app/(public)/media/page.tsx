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
  const rutubeMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
  if (rutubeMatch) return `https://rutube.ru/play/embed/${rutubeMatch[1]}/`;
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
      <section className="border-b border-[#DDE8F0] bg-[#F7FAFD] py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Медиацентр АНИЦ</p>
          <h1 className="mt-2 text-4xl font-black text-[#0D1C2E] lg:text-5xl">Медиа</h1>
          <p className="mt-3 max-w-xl text-lg text-[#4B6075]">
            Видеозаписи и фотоотчёты с мероприятий центра
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
        <div className="mb-8 flex gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/media?type=${tab.value}` : "/media"}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                typeFilter === tab.value
                  ? "bg-[#1A3A6B] text-white"
                  : "border border-[#DDE8F0] text-[#4B6075] hover:border-[#1A3A6B] hover:text-[#1A3A6B]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF4FB]">
              <Film className="h-8 w-8 text-[#1A3A6B]" />
            </div>
            <p className="text-lg font-bold text-[#4B6075]">Материалов пока нет</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const embedUrl = item.videoUrl ? getVideoEmbed(item.videoUrl) : null;
              return (
                <div key={item.id} className="overflow-hidden rounded-2xl border border-[#DDE8F0] bg-white">
                  {embedUrl ? (
                    <div className="relative aspect-video w-full bg-black">
                      <iframe
                        src={embedUrl}
                        className="h-full w-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                        frameBorder="0"
                      />
                    </div>
                  ) : item.thumbnail ? (
                    <div className="relative aspect-video w-full bg-[#F0F4F8]">
                      <Image
                        src={item.thumbnail.url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                      {item.type === "photo" && (
                        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-sm">
                          <Camera className="h-3 w-3 text-[#1A3A6B]" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A3A6B]">Фото</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-[#EEF4FB]">
                      <Film className="h-10 w-10 text-[#1A3A6B]/30" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5CAFD6]">
                        {item.type === "video" ? "Видео" : "Фотоотчёт"}
                      </span>
                      {item.eventDate && (
                        <span className="text-xs text-[#8B9BAD]">{item.eventDate}</span>
                      )}
                    </div>
                    <h3 className="line-clamp-2 font-bold leading-snug text-[#0D1C2E]">{item.title}</h3>
                    {item.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#4B6075]">{item.description}</p>
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
