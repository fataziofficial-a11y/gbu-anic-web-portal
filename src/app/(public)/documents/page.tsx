import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { FileText, Download } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Нормативные документы" };
export const revalidate = 300;

export default async function DocumentsPage() {
  const items = await db.query.documents.findMany({
    where: eq(documents.status, "active"),
    orderBy: [asc(documents.sortOrder), desc(documents.createdAt)],
  });

  return (
    <div>
      <section className="bg-[#060E18] border-b-[3px] border-[#5CAFD6] py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-[2px] w-6 bg-[#5CAFD6]" />
            <span className="text-[#5CAFD6] text-[11px] font-black uppercase tracking-[0.22em]">Правовая база</span>
          </div>
          <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-black text-white leading-[1.05]">Нормативные документы</h1>
          <p className="mt-4 text-base text-white/50">Регламенты, приказы и положения ГБУ АНИЦ</p>
        </div>
      </section>

      <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center bg-[#EEF4FB]">
              <FileText className="h-8 w-8 text-[#1A3A6B]" />
            </div>
            <p className="text-lg font-bold text-[#4B6075]">Документов пока нет</p>
          </div>
        ) : (
          <div className="divide-y divide-[#DDE8F0]">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#EEF4FB] text-[#1A3A6B]">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0D1C2E] leading-snug">{item.title}</p>
                  {item.issuedAt && (
                    <p className="text-xs text-[#8B9BAD] mt-0.5">{item.issuedAt}</p>
                  )}
                </div>
                {item.fileUrl && (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 text-[12px] font-bold text-[#1A3A6B] hover:text-[#5CAFD6] transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Открыть</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
