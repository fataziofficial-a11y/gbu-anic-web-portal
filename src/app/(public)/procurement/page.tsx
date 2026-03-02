import { db } from "@/lib/db";
import { procurements } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { ShoppingCart, ExternalLink, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Закупки" };
export const revalidate = 300;

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  open: { label: "Открыта", cls: "bg-blue-50 text-blue-700 border-blue-100", icon: Clock },
  closed: { label: "Завершена", cls: "bg-green-50 text-green-700 border-green-100", icon: CheckCircle2 },
  cancelled: { label: "Отменена", cls: "bg-red-50 text-red-600 border-red-100", icon: XCircle },
};

export default async function ProcurementPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status ?? "";

  const allItems = await db.query.procurements.findMany({
    orderBy: [desc(procurements.createdAt)],
  });

  const items = statusFilter
    ? allItems.filter((p) => p.status === statusFilter)
    : allItems;

  const openCount = allItems.filter((p) => p.status === "open").length;

  const tabs = [
    { label: "Все", value: "" },
    { label: "Открытые", value: "open" },
    { label: "Завершённые", value: "closed" },
  ];

  return (
    <div>
      <section className="arctic-page-header text-white py-16 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-glacial-light/50 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Государственные закупки
          </p>
          <h1 className="heading-serif text-4xl lg:text-5xl text-white mb-3">Закупки</h1>
          <p className="text-slate-300/70 text-lg max-w-xl">
            {openCount > 0
              ? `Открытых закупок: ${openCount}`
              : "Актуальные и завершённые закупки ГБУ АНИЦ"}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Status filter */}
        <div className="flex gap-2 mb-8">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/procurement?status=${tab.value}` : "/procurement"}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === tab.value
                  ? "bg-glacial text-white shadow-sm"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:border-glacial/40 hover:text-glacial-dark"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <ShoppingCart className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-lg font-medium">Закупок пока нет</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const st = STATUS_CONFIG[item.status ?? "open"] ?? STATUS_CONFIG.open;
              const StatusIcon = st.icon;
              const isExpired =
                item.deadline &&
                item.status === "open" &&
                new Date(item.deadline) < new Date();

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-6 transition-colors ${
                    isExpired ? "border-amber-200 opacity-75" : "border-slate-200/80 hover:border-glacial/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${st.cls}`}>
                          <StatusIcon className="h-3 w-3" />
                          {st.label}
                        </span>
                        {item.publishedAt && (
                          <span className="text-xs text-slate-400">
                            Опубликовано: {item.publishedAt}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-arctic-900 leading-snug mb-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        {item.amount && (
                          <span>
                            <span className="text-xs text-slate-400 uppercase tracking-wide mr-1">Сумма:</span>
                            <span className="font-medium text-arctic-900">{item.amount}</span>
                          </span>
                        )}
                        {item.deadline && (
                          <span className={isExpired ? "text-amber-600" : ""}>
                            <span className="text-xs text-slate-400 uppercase tracking-wide mr-1">Срок подачи:</span>
                            <span className="font-medium">{item.deadline}</span>
                            {isExpired && " (истёк)"}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.eisUrl && (
                      <a
                        href={item.eisUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-1.5 text-sm text-glacial hover:text-glacial-dark transition-colors font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        ЕИС
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 mt-8 text-center">
          Полная информация о закупках размещена на официальном сайте{" "}
          <a href="https://zakupki.gov.ru" target="_blank" rel="noopener noreferrer" className="text-glacial hover:underline">
            zakupki.gov.ru
          </a>
        </p>
      </div>
    </div>
  );
}
