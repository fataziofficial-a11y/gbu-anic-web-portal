import { db } from "@/lib/db";
import { knowledgeItems } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Edit } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { KnowledgeCategoriesManager } from "@/components/admin/KnowledgeCategoriesManager";

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

export default async function KnowledgeListPage() {
  const items = await db.query.knowledgeItems.findMany({
    orderBy: [desc(knowledgeItems.createdAt)],
    with: { category: true, department: true },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">База знаний</h1>
          <p className="text-sm text-gray-500 mt-0.5">Всего: {items.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <KnowledgeCategoriesManager />
          <Button asChild>
            <Link href="/admin/knowledge/new">
              <Plus className="mr-2 h-4 w-4" />
              Новая статья
            </Link>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <BookOpen className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Статей пока нет</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/knowledge/new">Создать первую статью</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Заголовок</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Категория</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Подразделение</th>
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
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {item.category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {item.department?.name ?? "—"}
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
                        <Link href={`/admin/knowledge/${item.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteButton
                        id={item.id}
                        apiPath="/api/knowledge"
                        label="статью"
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
