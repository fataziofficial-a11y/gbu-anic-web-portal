"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";

interface Option {
  id: number;
  name: string;
}

interface TeamFormData {
  id?: number;
  name?: string;
  position?: string;
  departmentId?: number | null;
  email?: string;
  bio?: string;
  sortOrder?: number;
}

interface Props {
  initialData?: TeamFormData;
  mode: "create" | "edit";
  departments: Option[];
}

export function TeamForm({ initialData, mode, departments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialData?.name ?? "");
  const [position, setPosition] = useState(initialData?.position ?? "");
  const [departmentId, setDepartmentId] = useState<string>(
    initialData?.departmentId ? String(initialData.departmentId) : "none"
  );
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Имя обязательно");
      return;
    }

    const payload = {
      name: name.trim(),
      position: position || undefined,
      departmentId: departmentId !== "none" ? parseInt(departmentId) : null,
      email: email || undefined,
      bio: bio || undefined,
      sortOrder,
    };

    startTransition(async () => {
      try {
        const url = mode === "edit" ? `/api/team/${initialData!.id}` : "/api/team";
        const method = mode === "edit" ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");

        toast.success(mode === "edit" ? "Сотрудник обновлён" : "Сотрудник добавлен");
        router.push("/admin/team");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "edit" ? "Редактировать сотрудника" : "Новый сотрудник"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/team")} disabled={isPending}>
            <X className="mr-2 h-4 w-4" />
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Сохранить
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Имя *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иванов Иван Иванович"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="position">Должность</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Научный сотрудник"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ivanov@anic.ru"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Биография</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Краткое описание..."
              rows={5}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Подразделение</p>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger><SelectValue placeholder="Выберите подразделение" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Не привязано —</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <Label htmlFor="sortOrder">Порядок отображения</Label>
            <Input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
