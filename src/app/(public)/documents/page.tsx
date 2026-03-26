import type { Metadata } from "next";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { PageBanner } from "@/components/public/PageBanner";
import { DocumentsAccordion } from "@/components/public/DocumentsAccordion";

export const metadata: Metadata = { title: "Документы" };
export const dynamic = "force-dynamic";

type DocItem = {
  id: string;
  title: string;
  fileUrl: string;
};

type Section = {
  name: string;
  docs: DocItem[];
};

export default async function DocumentsPage() {
  const rows = await db.query.documents.findMany({
    where: eq(documents.status, "active"),
    orderBy: [asc(documents.sectionOrder), asc(documents.sortOrder)],
    with: { file: { columns: { url: true } } },
  });

  // Группируем по разделам
  const sectionMap = new Map<string, DocItem[]>();
  for (const row of rows) {
    const sectionName = row.section ?? "Прочее";
    // Приоритет: загруженный файл → внешняя ссылка
    const url = (row as typeof row & { file?: { url: string } | null }).file?.url ?? row.fileUrl;
    if (!url) continue;

    if (!sectionMap.has(sectionName)) sectionMap.set(sectionName, []);
    sectionMap.get(sectionName)!.push({
      id: String(row.id),
      title: row.title,
      fileUrl: url,
    });
  }

  const sections: Section[] = Array.from(sectionMap.entries())
    .filter(([, docs]) => docs.length > 0)
    .map(([name, docs]) => ({ name, docs }));

  return (
    <div>
      <PageBanner
        eyebrow="Правовая база"
        title="Документы"
        description="Регламенты, приказы и положения ГБУ АНИЦ"
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <DocumentsAccordion sections={sections} />
      </div>
    </div>
  );
}
