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
  normative: "text-blue-400 border-blue-400/30",
  order: "text-amber-400 border-amber-400/30",
  regulation: "text-emerald-400 border-emerald-400/30",
  other: "text-white/30 border-white/10",
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
  const items = typeFilter
    ? activeItems.filter((d) => d.docType === typeFilter)
    : activeItems;

  const types = [...new Set(activeItems.map((d) => d.docType ?? "other"))];

  const tabs = [
    { label: "Все", value: "" },
    ...types.map((t) => ({ label: DOC_TYPE_LABELS[t] ?? t, value: t })),
  ];

  return (
    <div>
      <section className="arctic-page-header text-white py-16 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#00E5C0]/50 text-xs font-bold tracking-[0.2em] uppercase mb-3">
            Правовая база
          </p>
          <h1 className="heading-display text-4xl lg:text-5xl text-white mb-3">
            Нормативные документы
          </h1>
          <p className="text-white/40 text-lg max-w-xl">
            Регламенты, приказы и положения ГБУ АНИЦ
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Type filter */}
        {tabs.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {tabs.map((tab) => (
              <Link
                key={tab.value}
                href={tab.value ? `/documents?type=${tab.value}` : "/documents"}
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
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white/5 flex items-center justify-center mb-5">
              <FileText className="h-8 w-8 text-white/20" />
            </div>
            <p className="text-white/40 text-lg font-bold uppercase tracking-wider">Документов пока нет</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const colorClass = DOC_TYPE_COLORS[item.docType ?? "other"] ?? DOC_TYPE_COLORS.other;
              const typeLabel = DOC_TYPE_LABELS[item.docType ?? "other"] ?? item.docType;
              return (
                <div
                  key={item.id}
                  className="card-dark p-5 flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-white/5 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className={`inline-block text-[10px] font-black uppercase tracking-wider border px-2 py-0.5 ${colorClass}`}>
                        {typeLabel}
                      </span>
                      {item.issuedAt && (
                        <span className="text-xs text-white/20 font-bold">{item.issuedAt}</span>
                      )}
                    </div>
                    <p className="font-bold text-white leading-snug">{item.title}</p>
                  </div>
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 text-sm text-[#00E5C0]/70 hover:text-[#00E5C0] transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Открыть</span>
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
