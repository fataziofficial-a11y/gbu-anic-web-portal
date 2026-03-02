import { db } from "@/lib/db";
import { procurements } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { ShoppingCart, ExternalLink, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Закупки" };
export const revalidate = 300;

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  open: { label: "Открыта", cls: "text-blue-400 border-blue-400/30", icon: Clock },
  closed: { label: "Завершена", cls: "text-emerald-400 border-emerald-400/30", icon: CheckCircle2 },
  cancelled: { label: "Отменена", cls: "text-red-400 border-red-400/30", icon: XCircle },
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
          <p className="text-[#00E5C0]/50 text-xs font-bold tracking-[0.2em] uppercase mb-3">
            Государственные закупки
          </p>
          <h1 className="heading-display text-4xl lg:text-5xl text-white mb-3">Закупки</h1>
          <p className="text-white/40 text-lg max-w-xl">
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
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                statusFilter === tab.value
                  ? "bg-[#00E5C0] text-[#050E1C]"
                  : "border border-white/10 text-white/40 hover:border-[#00E5C0]/30 hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white/5 flex items-center justify-center mb-5">
              <ShoppingCart className="h-8 w-8 text-white/20" />
            </div>
            <p className="text-white/40 text-lg font-bold uppercase tracking-wider">Закупок пока нет</p>
          </div>
        ) : (
          <div className="space-y-3">
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
                  className={`card-dark p-6 ${isExpired ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider border px-2 py-0.5 ${st.cls}`}>
                          <StatusIcon className="h-3 w-3" />
                          {st.label}
                        </span>
                        {item.publishedAt && (
                          <span className="text-xs text-white/20 font-bold">
                            {item.publishedAt}
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 border border-amber-400/30 px-2 py-0.5">
                            Срок истёк
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white leading-snug mb-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-white/30 line-clamp-2 mb-3 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-6 text-xs">
                        {item.amount && (
                          <span>
                            <span className="text-white/20 uppercase tracking-wide mr-1">Сумма:</span>
                            <span className="font-black text-white">{item.amount}</span>
                          </span>
                        )}
                        {item.deadline && (
                          <span>
                            <span className="text-white/20 uppercase tracking-wide mr-1">Срок подачи:</span>
                            <span className={`font-black ${isExpired ? "text-amber-400" : "text-white"}`}>
                              {item.deadline}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    {item.eisUrl && (
                      <a
                        href={item.eisUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-1.5 text-xs text-[#00E5C0]/70 hover:text-[#00E5C0] transition-colors font-black uppercase tracking-wider border border-[#00E5C0]/20 px-3 py-2 hover:border-[#00E5C0]/50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
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
        <p className="text-xs text-white/20 mt-8 text-center">
          Полная информация о закупках размещена на официальном сайте{" "}
          <a href="https://zakupki.gov.ru" target="_blank" rel="noopener noreferrer" className="text-[#00E5C0]/50 hover:text-[#00E5C0] transition-colors">
            zakupki.gov.ru
          </a>
        </p>
      </div>
    </div>
  );
}
