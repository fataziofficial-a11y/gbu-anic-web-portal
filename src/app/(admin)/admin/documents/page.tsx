import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ScrollText, Edit, ExternalLink, FileText, Upload as UploadIcon } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

const DOC_TYPE_LABELS: Record<string, string> = {
  normative: "Нормативный",
  order: "Приказ",
  regulation: "Положение",
  other: "Прочее",
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active: { label: "Действующий", cls: "bg-green-100 text-green-700" },
  archived: { label: "Архивный", cls: "bg-gray-100 text-gray-500" },
};

export default async function DocumentsListPage() {
  const items = await db.query.documents.findMany({
    orderBy: [asc(documents.sectionOrder), asc(documents.sortOrder), desc(documents.createdAt)],
    with: { file: { columns: { url: true, originalName: true } } },
  });

  // Группируем по секциям
  const sectionMap = new Map<string, typeof items>();
  for (const item of items) {
    const sectionName = item.section ?? "Прочее";
    if (!sectionMap.has(sectionName)) sectionMap.set(sectionName, []);
    sectionMap.get(sectionName)!.push(item);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Документы</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} документов в {sectionMap.size} разделах
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/documents/new">
            <Plus className="mr-2 h-4 w-4" />Добавить документ
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <ScrollText className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Документов пока нет</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/documents/new">Добавить первый</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(sectionMap.entries()).map(([sectionName, docs]) => (
            <div key={sectionName} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* Section header */}
              <div className="flex items-center gap-3 bg-gray-50 border-b border-gray-200 px-4 py-3">
                <FileText className="h-4 w-4 text-gray-400" />
                <h2 className="font-semibold text-gray-700">{sectionName}</h2>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {docs.length}
                </span>
              </div>

              {/* Documents table */}
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {docs.map((item) => {
                    const st = STATUS_LABELS[item.status ?? "active"] ?? STATUS_LABELS.active;
                    const itemFile = item as typeof item & { file?: { url: string; originalName: string } | null };
                    const hasUpload = !!itemFile.file;
                    const hasUrl = !!item.fileUrl && !hasUpload;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 max-w-md">
                          <p className="font-medium text-gray-900 line-clamp-2">{item.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {DOC_TYPE_LABELS[item.docType ?? "other"]}
                            {item.issuedAt ? ` · ${item.issuedAt}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {hasUpload ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <UploadIcon className="h-3 w-3" />Загружен
                            </span>
                          ) : hasUrl ? (
                            <a href={item.fileUrl!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                              <ExternalLink className="h-3 w-3" />Ссылка
                            </a>
                          ) : (
                            <span className="text-gray-300">Нет файла</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                              <Link href={`/admin/documents/${item.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <DeleteButton id={item.id} apiPath="/api/documents" label="документ" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
