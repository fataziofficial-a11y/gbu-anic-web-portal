"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, UserCog, Trash2, Edit } from "lucide-react";
import {
  SECTION_LABELS,
  ROLE_LABELS,
  ROLE_DEFAULT_SECTIONS,
  getUserSections,
  type Section,
} from "@/lib/permissions";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[] | null;
}

// Разделы, которые показываем в таблице-матрице (без settings, users, files — служебные)
const MATRIX_SECTIONS: Section[] = [
  "news", "knowledge", "projects", "team", "departments",
  "publications", "media", "partners", "documents",
  "procurements", "crosspost", "tickets",
];

const SHORT_LABELS: Record<Section, string> = {
  news: "Нов",
  knowledge: "Б.З",
  projects: "Пр",
  team: "Сотр",
  departments: "Подр",
  publications: "Публ",
  media: "Мед",
  partners: "Парт",
  documents: "Доки",
  procurements: "Закуп",
  files: "Файл",
  crosspost: "Кросс",
  tickets: "Тик",
  settings: "Нас",
  users: "Польз",
};

export default function UsersPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<number | null>(null);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const data = await res.json();
      setUsers(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  /** Переключить раздел у пользователя (только admin) */
  async function toggleSection(user: User, section: Section) {
    if (!isAdmin) return;

    // Текущий эффективный набор прав
    const current = getUserSections(user.role, user.permissions);
    let next: string[];
    if (current.includes(section)) {
      // Убираем
      next = current.filter((s) => s !== section);
    } else {
      // Добавляем
      next = [...current, section];
    }

    // Если итог совпадает с дефолтом роли — сбрасываем custom (null)
    const roleDefault = ROLE_DEFAULT_SECTIONS[user.role] ?? [];
    const sameAsDefault =
      next.length === roleDefault.length &&
      next.every((s) => roleDefault.includes(s as Section));

    const newPermissions = sameAsDefault ? null : next;

    setSaving(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: newPermissions }),
      });
      if (!res.ok) { toast.error("Ошибка сохранения"); return; }
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, permissions: newPermissions } : u)
      );
    } finally {
      setSaving(null);
    }
  }

  async function deleteUser(id: number, name: string) {
    if (!confirm(`Удалить пользователя «${name}»?`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Ошибка удаления"); return; }
    toast.success("Пользователь удалён");
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="p-6 space-y-5">
      {/* Шапка */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Пользователи</h1>
          <p className="text-sm text-gray-500">Учётные записи CMS и доступ к разделам</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <Plus className="mr-2 h-4 w-4" />Создать
          </Link>
        </Button>
      </div>

      {/* Поиск */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Легенда разделов */}
      {isAdmin && (
        <p className="text-xs text-gray-400">
          Нажмите на ячейку, чтобы изменить доступ к разделу. Синяя — доступ есть, серая — нет.
        </p>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center text-gray-400">Загрузка…</div>
      ) : users.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 text-gray-400">
          <UserCog className="h-8 w-8" />
          <p className="text-sm">Пользователей нет</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Имя</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Роль</th>
                {/* Колонки разделов */}
                {MATRIX_SECTIONS.map((s) => (
                  <th
                    key={s}
                    className="px-2 py-3 font-medium text-gray-500 text-center text-[11px] whitespace-nowrap"
                    title={SECTION_LABELS[s]}
                  >
                    {SHORT_LABELS[s]}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const effective = getUserSections(user.role, user.permissions);
                const hasCustom = user.permissions && user.permissions.length > 0;
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-700">{ROLE_LABELS[user.role] ?? user.role}</span>
                        {hasCustom && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 w-fit">
                            индив.
                          </Badge>
                        )}
                      </div>
                    </td>
                    {/* Ячейки-галочки */}
                    {MATRIX_SECTIONS.map((s) => {
                      const on = effective.includes(s);
                      return (
                        <td key={s} className="px-2 py-3 text-center">
                          <button
                            disabled={!isAdmin || saving === user.id}
                            onClick={() => toggleSection(user, s)}
                            className={[
                              "mx-auto flex h-6 w-6 items-center justify-center rounded text-xs font-bold transition-colors",
                              on
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "bg-gray-100 text-gray-300 hover:bg-gray-200",
                              !isAdmin ? "cursor-default" : "cursor-pointer",
                            ].join(" ")}
                            title={on ? `Убрать «${SECTION_LABELS[s]}»` : `Дать «${SECTION_LABELS[s]}»`}
                          >
                            {on ? "✓" : "·"}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                          <Link href={`/admin/users/${user.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                            onClick={() => deleteUser(user.id, user.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
