import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const STATIC_PAGES = [
  { path: "",          priority: 1.0, changeFreq: "daily"   },
  { path: "/news",     priority: 0.9, changeFreq: "daily"   },
  { path: "/science",  priority: 0.8, changeFreq: "weekly"  },
  { path: "/documents",priority: 0.7, changeFreq: "monthly" },
  { path: "/about",    priority: 0.7, changeFreq: "monthly" },
  { path: "/contacts", priority: 0.6, changeFreq: "monthly" },
  { path: "/partners", priority: 0.6, changeFreq: "monthly" },
] as const;

export const revalidate = 3600; // обновляем каждый час

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? "https://аниц.рф";

  const staticUrls: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, priority, changeFreq }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: changeFreq,
    priority,
  }));

  let newsUrls: MetadataRoute.Sitemap = [];
  try {
    const items = await db.query.news.findMany({
      where: eq(news.status, "published"),
      columns: { slug: true, publishedAt: true, updatedAt: true },
      orderBy: [desc(news.publishedAt)],
      limit: 1000,
    });

    newsUrls = items.map((item) => ({
      url: `${base}/news/${item.slug}`,
      lastModified: item.updatedAt ?? item.publishedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // БД недоступна — возвращаем только статику
  }

  return [...staticUrls, ...newsUrls];
}
