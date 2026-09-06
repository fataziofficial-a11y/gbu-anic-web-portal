import { PublicHeader } from "@/components/public/PublicHeader";
import { db } from "@/lib/db";
import { newsCategories } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { PublicFooter } from "@/components/public/PublicFooter";
import { ScrollToTop } from "@/components/public/ScrollToTop";
import { SiteSearch } from "@/components/public/SiteSearch";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Рубрики новостей для выпадающего списка в шапке. Читаем здесь, а не
  // в самом заголовке: он клиентский, а список ведёт редактор в админке.
  const rubrics = await db
    .select({ name: newsCategories.name, slug: newsCategories.slug })
    .from(newsCategories)
    .orderBy(asc(newsCategories.sortOrder), asc(newsCategories.name));

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#0D1C2E]">
      <PublicHeader rubrics={rubrics} />
      <main id="main-content" className="flex-1 pt-[67px]">{children}</main>
      <PublicFooter />
      <ScrollToTop />
      <SiteSearch />
    </div>
  );
}

