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

interface ProjectFormData {
  id?: number;
  title?: string;
  description?: string;
  departmentId?: number | null;
  status?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  lead?: string | null;
  consultant?: string | null;
  partnerOrg?: string | null;
  partnersList?: string[] | null;
  duration?: string | null;
}

interface Props {
  initialData?: ProjectFormData;
  mode: "create" | "edit";
  departments: Option[];
}

export function ProjectForm({ initialData, mode, departments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [departmentId, setDepartmentId] = useState<string>(
    initialData?.departmentId ? String(initialData.departmentId) : "none"
  );
  const [status, setStatus] = useState(initialData?.status ?? "planned");
  const [startDate, setStartDate] = useState(initialData?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialData?.endDate ?? "");
  const [type, setType] = useState(initialData?.type ?? "project");
  const [lead, setLead] = useState(initialData?.lead ?? "");
  const [consultant, setConsultant] = useState(initialData?.consultant ?? "");
  const [partnerOrg, setPartnerOrg] = useState(initialData?.partnerOrg ?? "");
  const [partnersListRaw, setPartnersListRaw] = useState(
    (initialData?.partnersList ?? []).join("\n")
  );
  const [duration, setDuration] = useState(initialData?.duration ?? "");

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Название обязательно");
      return;
    }

    const partnersList = partnersListRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      description: description || undefined,
      departmentId: departmentId !== "none" ? parseInt(departmentId) : null,
      status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      type,
      lead: lead.trim() || null,
      consultant: consultant.trim() || null,
      partnerOrg: partnerOrg.trim() || null,
      partnersList,
      duration: duration.trim() || null,
    };

    startTransition(async () => {
      try {
        const url = mode === "edit" ? `/api/projects/${initialData!.id}` : "/api/projects";
        const method = mode === "edit" ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");

        toast.success(mode === "edit" ? "Проект обновлён" : "Проект создан");
        router.push("/admin/projects");
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
          {mode === "edit" ? "Редактировать проект" : "Новый проект"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/projects")} disabled={isPending}>
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
            <Label htmlFor="title">Название проекта *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название проекта"
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание проекта..."
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="duration">Сроки реализации (текст)</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Например: 2025-2028 годы"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead">Научный руководитель</Label>
            <Input
              id="lead"
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              placeholder="Научный руководитель: ..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="consultant">Научный консультант</Label>
            <Input
              id="consultant"
              value={consultant}
              onChange={(e) => setConsultant(e.target.value)}
              placeholder="Научный консультант: ..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="partnerOrg">Индустриальный партнёр</Label>
            <Input
              id="partnerOrg"
              value={partnerOrg}
              onChange={(e) => setPartnerOrg(e.target.value)}
              placeholder="Индустриальный партнер: ..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="partnersList">Партнёры (по одному на строку)</Label>
            <Textarea
              id="partnersList"
              value={partnersListRaw}
              onChange={(e) => setPartnersListRaw(e.target.value)}
              placeholder={"Партнёр 1\nПартнёр 2"}
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Тип записи</p>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Проект</SelectItem>
                <SelectItem value="actual_work">Актуальная работа</SelectItem>
                <SelectItem value="editorial_project">Проектная инициатива</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Статус</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Планируется</SelectItem>
                <SelectItem value="active">Активный</SelectItem>
                <SelectItem value="completed">Завершён</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
            <p className="text-sm font-medium text-gray-700">Даты (опционально)</p>
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs">Начало</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs">Окончание</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
