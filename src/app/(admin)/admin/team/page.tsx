import { db } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Users, Edit } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function TeamListPage() {
  const items = await db.query.teamMembers.findMany({
    orderBy: [asc(teamMembers.sortOrder), asc(teamMembers.name)],
    with: { department: true, photo: true },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Команда</h1>
          <p className="text-sm text-gray-500 mt-0.5">Всего: {items.length} сотрудников</p>
        </div>
        <Button asChild>
          <Link href="/admin/team/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить сотрудника
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <Users className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Сотрудников пока нет</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/team/new">Добавить первого</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Сотрудник</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Должность</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Подразделение</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.photo ? (
                        <img
                          src={item.photo.url}
                          alt={item.name}
                          className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-gray-500">
                            {item.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <p className="font-medium text-gray-900">{item.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.position ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {item.department?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/admin/team/${item.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteButton
                        id={item.id}
                        apiPath="/api/team"
                        label="сотрудника"
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
