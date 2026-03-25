"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, X, RotateCcw } from "lucide-react";
import {
  ALL_SECTIONS,
  SECTION_LABELS,
  ROLE_LABELS,
  ROLE_DEFAULT_SECTIONS,
  getUserSections,
  type Section,
} from "@/lib/permissions";

interface UserFormData {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  permissions?: string[] | null;
}

interface Props {
  mode: "create" | "edit";
  initialData?: UserFormData;
}

const ROLES = [
  "admin",
  "news_editor",
  "researcher",
  "hr_specialist",
  "procurement_specialist",
  "editor",
  "author",
] as const;

export function UserForm({ mode, initialData }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const isAdmin = session?.user?.role === "admin";

  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initialData?.role ?? "author");

  // permissions: null = использовать дефолт роли; array = переопределение
  const [customPermissions, setCustomPermissions] = useState<string[] | null>(
    initialData?.permissions ?? null
  );

  // Текущий эффективный список разделов
  const effective = getUserSections(role, customPermissions);
  const hasCustom = customPermissions !== null;

  function toggleSection(section: Section) {
    if (!isAdmin) return;
    const current = effective;
    const next = current.includes(section)
      ? current.filter((s) => s !== section)
      : [...current, section];

    // Если совпадает с дефолтом роли — сбрасываем кастом
    const roleDefault = ROLE_DEFAULT_SECTIONS[role] ?? [];
    const sameAsDefault =
      next.length === roleDefault.length &&
      next.every((s) => roleDefault.includes(s as Section));

    setCustomPermissions(sameAsDefault ? null : next);
  }

  /** Выбрать всё */
  function selectAll() {
    const roleDefault = ROLE_DEFAULT_SECTIONS[role] ?? [];
    const allSame = ALL_SECTIONS.length === roleDefault.length;
    setCustomPermissions(allSame ? null : [...ALL_SECTIONS]);
  }

  /** Снять всё */
  function selectNone() {
    setCustomPermissions([]);
  }

  /** Сбросить к дефолту роли */
  function resetToRole() {
    setCustomPermissions(null);
  }

  /** При смене роли — сбрасываем кастомные права */
  function handleRoleChange(newRole: string) {
    setRole(newRole);
    setCustomPermissions(null);
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Имя обязательно"); return; }
    if (!email.trim()) { toast.error("Email обязателен"); return; }
    if (mode === "create" && !password) { toast.error("Пароль обязателен"); return; }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      email: email.trim(),
      role,
    };
    if (password) payload.password = password;
    if (isAdmin) payload.permissions = customPermissions;

    startTransition(async () => {
      try {
        const url = mode === "edit" ? `/api/users/${initialData!.id}` : "/api/users";
        const method = mode === "edit" ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");
        toast.success(mode === "edit" ? "Пользователь обновлён" : "Пользователь создан");
        router.push("/admin/users");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {mode === "edit" ? "Редактировать пользователя" : "Новый пользователь"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {mode === "edit" ? initialData?.email : "Учётная запись CMS"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/users")} disabled={isPending}>
            <X className="mr-2 h-4 w-4" />Отмена
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Сохранить
          </Button>
        </div>
      </div>

      {/* Основные данные */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Основное</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Имя *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Иван Иванов" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ivan@example.ru" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">
              {mode === "create" ? "Пароль *" : "Новый пароль (оставьте пустым, чтобы не менять)"}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "create" ? "Минимум 6 символов" : "••••••"}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Роль</Label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Разделы — только для admin */}
      {isAdmin && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Доступ к разделам
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {hasCustom
                  ? "Индивидуальные права (переопределены)"
                  : `По умолчанию для роли «${ROLE_LABELS[role] ?? role}»`}
              </p>
            </div>
            <div className="flex gap-2">
              {hasCustom && (
                <Button variant="outline" size="sm" onClick={resetToRole} title="Сбросить к умолчаниям роли">
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />Сбросить
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={selectAll}>Все</Button>
              <Button variant="outline" size="sm" onClick={selectNone}>Ни одного</Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ALL_SECTIONS.map((section) => {
              const on = effective.includes(section);
              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => toggleSection(section)}
                  className={[
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                    on
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100",
                  ].join(" ")}
                >
                  <span className={[
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
                    on ? "border-blue-400 bg-blue-500 text-white" : "border-gray-300 bg-white",
                  ].join(" ")}>
                    {on ? "✓" : ""}
                  </span>
                  {SECTION_LABELS[section]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
