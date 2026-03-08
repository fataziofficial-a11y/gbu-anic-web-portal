import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { FileText, Download } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Нормативные документы" };
export const revalidate = 300;

const DOC_TYPE_LABELS: Record<string, string> = {
  normative: "Нормативный",
  order: "Приказ",
  regulation: "Положение",
  other: "Прочее",
};

const DOC_TYPE_COLORS: Record<string, string> = {
  normative: "text-[#1A3A6B] bg-[#EEF4FB] border-[#C0D5EE]",
  order: "text-[#7A4D1A] bg-[#FEF3E2] border-[#F0C87A]",
  regulation: "text-[#1A7A5A] bg-[#E8F5F0] border-[#B8DDD1]",
  other: "text-[#4B6075] bg-[#F0F4F8] border-[#DDE8F0]",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const typeFilter = sp.type ?? "";

  const allItems = await db.query.documents.findMany({
    orderBy: [asc(documents.sortOrder), desc(documents.createdAt)],
  });

  const activeItems = allItems.filter((d) => d.status === "active");
  const items = typeFilter ? activeItems.filter((d) => d.docType === typeFilter) : activeItems;
  const types = [...new Set(activeItems.map((d) => d.docType ?? "other"))];

  const tabs = [
    { label: "Все", value: "" },
    ...types.map((t) => ({ label: DOC_TYPE_LABELS[t] ?? t, value: t })),
  ];

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

      <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
        {tabs.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.value}
                href={tab.value ? `/documents?type=${tab.value}` : "/documents"}
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
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF4FB]">
              <FileText className="h-8 w-8 text-[#1A3A6B]" />
            </div>
            <p className="text-lg font-bold text-[#4B6075]">Документов пока нет</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const colorClass = DOC_TYPE_COLORS[item.docType ?? "other"] ?? DOC_TYPE_COLORS.other;
              const typeLabel = DOC_TYPE_LABELS[item.docType ?? "other"] ?? item.docType;
              return (
                <div key={item.id} className="flex items-start gap-4 rounded-2xl border border-[#DDE8F0] bg-white p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
                        {typeLabel}
                      </span>
                      {item.issuedAt && (
                        <span className="text-xs font-semibold text-[#8B9BAD]">{item.issuedAt}</span>
                      )}
                    </div>
                    <p className="font-bold leading-snug text-[#0D1C2E]">{item.title}</p>
                  </div>
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#1A3A6B] transition hover:text-[#5CAFD6]"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs uppercase tracking-wider">Открыть</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
