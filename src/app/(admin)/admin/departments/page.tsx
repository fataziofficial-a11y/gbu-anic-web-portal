"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Edit, Loader2 } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { DepartmentDialog } from "@/components/admin/DepartmentDialog";

interface Department {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number | null;
  createdAt: string | null;
  head?: { name: string } | null;
}

export default function DepartmentsPage() {
  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/departments");
      const json = await res.json();
      setItems(json.data?.items ?? []);
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setDialogOpen(true);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Подразделения</h1>
          <p className="text-sm text-gray-500 mt-0.5">Всего: {items.length}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить подразделение
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <Building2 className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Подразделений пока нет</p>
          <Button className="mt-4" variant="outline" onClick={openCreate}>
            Создать первое
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Описание</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Руководитель</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Порядок</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                    {item.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {item.head?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{item.sortOrder ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DeleteButton
                        id={item.id}
                        apiPath="/api/departments"
                        label="подразделение"
                        onDeleted={load}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editing ? {
          id: editing.id,
          name: editing.name,
          description: editing.description ?? "",
          sortOrder: editing.sortOrder ?? 0,
        } : undefined}
        onSuccess={load}
      />
    </div>
  );
}
