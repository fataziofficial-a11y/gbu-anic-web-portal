import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Edit } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  draft: "Черновик",
  published: "Опубликовано",
  archived: "Архив",
};
const statusColor: Record<string, string> = {
  draft: "secondary",
  published: "default",
  archived: "outline",
};
const templateLabel: Record<string, string> = {
  default: "Стандартный",
  about: "О нас",
  contacts: "Контакты",
};

export default async function PagesListPage() {
  const items = await db.query.pages.findMany({
    orderBy: [desc(pages.createdAt)],
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Страницы</h1>
          <p className="text-sm text-gray-500 mt-0.5">Всего: {items.length}</p>
        </div>
        <Button asChild>
          <Link href="/admin/pages/new">
            <Plus className="mr-2 h-4 w-4" />
            Новая страница
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <FileText className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Страниц пока нет</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/pages/new">Создать первую страницу</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Заголовок</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Шаблон</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-400">/{item.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {templateLabel[item.template ?? "default"] ?? item.template}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusColor[item.status ?? "draft"] as "default" | "secondary" | "outline"}>
                      {statusLabel[item.status ?? "draft"]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("ru-RU")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/admin/pages/${item.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteButton
                        id={item.id}
                        apiPath="/api/pages"
                        label="страницу"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
