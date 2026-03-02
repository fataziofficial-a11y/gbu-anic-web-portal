import { db } from "@/lib/db";
import { publications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, BookMarked, Edit, ExternalLink } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function PublicationsListPage() {
  const items = await db.query.publications.findMany({
    orderBy: [desc(publications.createdAt)],
    with: { department: true },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Публикации</h1>
          <p className="text-sm text-gray-500 mt-0.5">Всего: {items.length}</p>
        </div>
        <Button asChild>
          <Link href="/admin/publications/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить публикацию
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <BookMarked className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Публикаций пока нет</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/publications/new">Добавить первую</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Авторы</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Журнал</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Год</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Подразделение</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-gray-900 line-clamp-2">{item.title}</p>
                    {item.doi && (
                      <a
                        href={item.doi.startsWith("http") ? item.doi : `https://doi.org/${item.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {item.doi}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px]">
                    <span className="line-clamp-2">{item.authors ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px]">
                    <span className="line-clamp-2">{item.journal ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.year ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {item.department?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/admin/publications/${item.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteButton
                        id={item.id}
                        apiPath="/api/publications"
                        label="публикацию"
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
