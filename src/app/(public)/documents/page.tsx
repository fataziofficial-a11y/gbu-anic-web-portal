import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { PageBanner } from "@/components/public/PageBanner";
import { DocumentsAccordion } from "@/components/public/DocumentsAccordion";

export const metadata: Metadata = { title: "Документы" };
export const revalidate = 300;

export default async function DocumentsPage() {
  const items = await db.query.documents.findMany({
    where: eq(documents.status, "active"),
    orderBy: [
      asc(documents.sectionOrder),
      asc(documents.section),
      desc(documents.issuedAt),
      asc(documents.sortOrder),
    ],
  });

  // Группируем по разделу
  const sectionMap = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.section ?? "Прочее";
    if (!sectionMap.has(key)) sectionMap.set(key, []);
    sectionMap.get(key)!.push(item);
  }

  const sections = Array.from(sectionMap.entries()).map(([name, docs]) => ({
    name,
    docs: docs.map((d) => ({
      id: d.id,
      title: d.title,
      fileUrl: d.fileUrl,
      issuedAt: d.issuedAt,
    })),
  }));

  return (
    <div>
      <PageBanner
        eyebrow="Правовая база"
        title="Документы"
        description="Регламенты, приказы и положения ГБУ АНИЦ"
      />

      <div className="mx-auto max-w-225 px-4 py-12 sm:px-6">
        <DocumentsAccordion sections={sections} />
      </div>
    </div>
  );
}
