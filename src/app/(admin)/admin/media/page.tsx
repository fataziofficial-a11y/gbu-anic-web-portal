import { db } from "@/lib/db";
import { mediaItems } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Film, Edit } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = { video: "Видео", photo: "Фото" };
const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  published: { label: "Опубликовано", cls: "bg-green-100 text-green-700" },
  draft: { label: "Черновик", cls: "bg-gray-100 text-gray-600" },
};

export default async function MediaListPage() {
  const items = await db.query.mediaItems.findMany({
    orderBy: [desc(mediaItems.createdAt)],
    with: { thumbnail: true },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Медиа</h1>
          <p className="text-sm text-gray-500 mt-0.5">Всего: {items.length}</p>
        </div>
        <Button asChild>
          <Link href="/admin/media/new">
            <Plus className="mr-2 h-4 w-4" />Добавить медиа
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <Film className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Медиа-материалов пока нет</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/media/new">Добавить первый</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Превью</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Тип</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const st = STATUS_LABELS[item.status ?? "draft"] ?? STATUS_LABELS.draft;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {item.thumbnail ? (
                        <div className="relative w-16 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image src={item.thumbnail.url} alt="" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-10 rounded bg-gray-100 flex items-center justify-center">
                          <Film className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 line-clamp-2">{item.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {TYPE_LABELS[item.type] ?? item.type}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {item.eventDate ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                          <Link href={`/admin/media/${item.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteButton id={item.id} apiPath="/api/media" label="медиа" />
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
