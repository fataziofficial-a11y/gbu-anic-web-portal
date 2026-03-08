import { db } from "@/lib/db";
import { procurements } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { ShoppingCart, ExternalLink, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Закупки" };
export const revalidate = 300;

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  open: { label: "Открыта", cls: "text-[#1A7A5A] bg-[#E8F5F0] border-[#B8DDD1]", icon: Clock },
  closed: { label: "Завершена", cls: "text-[#1A3A6B] bg-[#EEF4FB] border-[#C0D5EE]", icon: CheckCircle2 },
  cancelled: { label: "Отменена", cls: "text-[#7A1A1A] bg-[#FEE8E8] border-[#F0B8B8]", icon: XCircle },
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

  const items = statusFilter ? allItems.filter((p) => p.status === statusFilter) : allItems;
  const openCount = allItems.filter((p) => p.status === "open").length;

  const tabs = [
    { label: "Все", value: "" },
    { label: "Открытые", value: "open" },
    { label: "Завершённые", value: "closed" },
  ];

  return (
    <div>
      <section className="bg-[#060E18] border-b-[3px] border-[#5CAFD6] py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-[2px] w-6 bg-[#5CAFD6]" />
            <span className="text-[#5CAFD6] text-[11px] font-black uppercase tracking-[0.22em]">Государственные закупки</span>
          </div>
          <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-black text-white leading-[1.05]">Закупки</h1>
          <p className="mt-4 text-base text-white/50">
            {openCount > 0
              ? `Открытых закупок: ${openCount}`
              : "Актуальные и завершённые закупки ГБУ АНИЦ"}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
        <div className="mb-8 flex gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/procurement?status=${tab.value}` : "/procurement"}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                statusFilter === tab.value
                  ? "bg-[#1A3A6B] text-white"
                  : "border border-[#DDE8F0] text-[#4B6075] hover:border-[#1A3A6B] hover:text-[#1A3A6B]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF4FB]">
              <ShoppingCart className="h-8 w-8 text-[#1A3A6B]" />
            </div>
            <p className="text-lg font-bold text-[#4B6075]">Закупок пока нет</p>
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
                  className={`rounded-2xl border border-[#DDE8F0] bg-white p-6 ${isExpired ? "opacity-70" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${st.cls}`}>
                          <StatusIcon className="h-3 w-3" />
                          {st.label}
                        </span>
                        {item.publishedAt && (
                          <span className="text-xs font-semibold text-[#8B9BAD]">{item.publishedAt}</span>
                        )}
                        {isExpired && (
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                            Срок истёк
                          </span>
                        )}
                      </div>
                      <h3 className="mb-2 font-bold leading-snug text-[#0D1C2E]">{item.title}</h3>
                      {item.description && (
                        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-[#4B6075]">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-6 text-xs">
                        {item.amount && (
                          <span>
                            <span className="mr-1 uppercase tracking-wide text-[#8B9BAD]">Сумма:</span>
                            <span className="font-bold text-[#0D1C2E]">{item.amount}</span>
                          </span>
                        )}
                        {item.deadline && (
                          <span>
                            <span className="mr-1 uppercase tracking-wide text-[#8B9BAD]">Срок подачи:</span>
                            <span className={`font-bold ${isExpired ? "text-amber-600" : "text-[#0D1C2E]"}`}>
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
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#DDE8F0] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#1A3A6B] transition hover:border-[#1A3A6B]"
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

        <p className="mt-8 text-center text-xs text-[#8B9BAD]">
          Полная информация о закупках размещена на официальном сайте{" "}
          <a href="https://zakupki.gov.ru" target="_blank" rel="noopener noreferrer" className="text-[#1A3A6B] hover:underline">
            zakupki.gov.ru
          </a>
        </p>
      </div>
    </div>
  );
}
