import { db } from "@/lib/db";
import { mediaItems } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Film, Camera, Play } from "lucide-react";
import type { Metadata } from "next";
import { PageBanner } from "@/components/public/PageBanner";

export const metadata: Metadata = { title: "Медиа" };
export const revalidate = 60;

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
      <PageBanner
        eyebrow="Медиацентр АНИЦ"
        title="Медиа"
        description="Видеозаписи и фотоотчёты с мероприятий центра"
      />

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
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/media/${item.id}`}
                className="group overflow-hidden rounded-2xl border border-[#DDE8F0] bg-white transition hover:border-[#5CAFD6] hover:shadow-md"
              >
                {/* Thumbnail */}
                {item.thumbnail ? (
                  <div className="relative aspect-video w-full overflow-hidden bg-[#F0F4F8]">
                    <Image
                      src={item.thumbnail.url}
                      alt={item.title}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition group-hover:bg-[#1A3A6B]/80 group-hover:scale-110">
                          <Play className="h-6 w-6 ml-0.5" />
                        </div>
                      </div>
                    )}
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

                {/* Content */}
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5CAFD6]">
                      {item.type === "video" ? "Видео" : "Фотоотчёт"}
                    </span>
                    {item.eventDate && (
                      <span className="text-xs text-[#8B9BAD]">{item.eventDate}</span>
                    )}
                  </div>
                  <h3 className="line-clamp-2 font-bold leading-snug text-[#0D1C2E] transition group-hover:text-[#1A3A6B]">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#4B6075]">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
