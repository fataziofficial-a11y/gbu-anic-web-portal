import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { FileText, ExternalLink, Download } from "lucide-react";
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
  normative: "bg-blue-50 text-blue-700",
  order: "bg-amber-50 text-amber-700",
  regulation: "bg-emerald-50 text-emerald-700",
  other: "bg-slate-50 text-slate-600",
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
          <p className="text-glacial-light/50 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Правовая база
          </p>
          <h1 className="heading-serif text-4xl lg:text-5xl text-white mb-3">
            Нормативные документы
          </h1>
          <p className="text-slate-300/70 text-lg max-w-xl">
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
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  typeFilter === tab.value
                    ? "bg-glacial text-white shadow-sm"
                    : "bg-white border border-slate-200/80 text-slate-600 hover:border-glacial/40 hover:text-glacial-dark"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-lg font-medium">Документов пока нет</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const typeColor = DOC_TYPE_COLORS[item.docType ?? "other"] ?? DOC_TYPE_COLORS.other;
              const typeLabel = DOC_TYPE_LABELS[item.docType ?? "other"] ?? item.docType;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-5 flex items-start gap-4 hover:border-glacial/30 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${typeColor}`}>
                        {typeLabel}
                      </span>
                      {item.issuedAt && (
                        <span className="text-xs text-slate-400">{item.issuedAt}</span>
                      )}
                    </div>
                    <p className="font-medium text-arctic-900 leading-snug">{item.title}</p>
                  </div>
                  {(item.fileUrl) && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 text-sm text-glacial hover:text-glacial-dark transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Открыть</span>
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
