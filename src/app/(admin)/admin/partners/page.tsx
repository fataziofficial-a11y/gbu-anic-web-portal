import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Handshake, Edit, Globe } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function PartnersListPage() {
  const items = await db.query.partners.findMany({
    orderBy: [asc(partners.sortOrder), asc(partners.name)],
    with: { logo: true },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Партнёры</h1>
          <p className="text-sm text-gray-500 mt-0.5">Всего: {items.length}</p>
        </div>
        <Button asChild>
          <Link href="/admin/partners/new">
            <Plus className="mr-2 h-4 w-4" />Добавить партнёра
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <Handshake className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Партнёров пока нет</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/partners/new">Добавить первого</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Лого</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Услуги/проекты</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Сайт</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {item.logo ? (
                      <div className="relative w-14 h-10 rounded overflow-hidden bg-gray-50 flex-shrink-0">
                        <Image src={item.logo.url} alt={item.name} fill className="object-contain" />
                      </div>
                    ) : (
                      <div className="w-14 h-10 rounded bg-gray-100 flex items-center justify-center">
                        <Handshake className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px]">
                    <span className="line-clamp-2">{item.services ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {item.websiteUrl ? (
                      <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                        <Globe className="h-3 w-3" />Сайт
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/admin/partners/${item.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteButton id={item.id} apiPath="/api/partners" label="партнёра" />
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
