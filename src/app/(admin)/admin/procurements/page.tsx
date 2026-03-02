import { db } from "@/lib/db";
import { procurements } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, Edit, ExternalLink } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open: { label: "Открыта", cls: "bg-blue-100 text-blue-700" },
  closed: { label: "Завершена", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Отменена", cls: "bg-red-100 text-red-600" },
};

export default async function ProcurementsListPage() {
  const items = await db.query.procurements.findMany({
    orderBy: [desc(procurements.createdAt)],
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Закупки</h1>
          <p className="text-sm text-gray-500 mt-0.5">Всего: {items.length}</p>
        </div>
        <Button asChild>
          <Link href="/admin/procurements/new">
            <Plus className="mr-2 h-4 w-4" />Добавить закупку
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <ShoppingCart className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Закупок пока нет</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/procurements/new">Добавить первую</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Предмет закупки</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Сумма</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Дедлайн</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ЕИС</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const st = STATUS_LABELS[item.status ?? "open"] ?? STATUS_LABELS.open;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 max-w-sm">
                      <p className="font-medium text-gray-900 line-clamp-2">{item.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.amount ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.deadline ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      {item.eisUrl ? (
                        <a href={item.eisUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                          <ExternalLink className="h-3 w-3" />ЕИС
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                          <Link href={`/admin/procurements/${item.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteButton id={item.id} apiPath="/api/procurements" label="закупку" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
