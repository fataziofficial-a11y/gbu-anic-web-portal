"use client";

import { useState, useTransition, useEffect } from "react";
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

const DOC_TYPES = [
  { value: "normative", label: "Нормативный документ" },
  { value: "order", label: "Приказ" },
  { value: "regulation", label: "Положение" },
  { value: "other", label: "Прочее" },
];

interface DocumentFormData {
  id?: number;
  title?: string;
  docType?: string;
  fileUrl?: string | null;
  issuedAt?: string | null;
  status?: string;
  sortOrder?: number;
  section?: string | null;
  sectionOrder?: number;
}

interface Props {
  initialData?: DocumentFormData;
  mode: "create" | "edit";
}

export function DocumentForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [docType, setDocType] = useState(initialData?.docType ?? "normative");
  const [fileUrl, setFileUrl] = useState(initialData?.fileUrl ?? "");
  const [issuedAt, setIssuedAt] = useState(initialData?.issuedAt ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "active");
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0);
  const [section, setSection] = useState(initialData?.section ?? "");
  const [sectionOrder, setSectionOrder] = useState(initialData?.sectionOrder ?? 0);
  const [existingSections, setExistingSections] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/documents/sections")
      .then((r) => r.json())
      .then((json) => { if (Array.isArray(json.data)) setExistingSections(json.data); })
      .catch(() => {});
  }, []);

  async function handleSave() {
    if (!title.trim()) { toast.error("Название обязательно"); return; }

    const payload = {
      title: title.trim(),
      docType,
      fileUrl: fileUrl || null,
      issuedAt: issuedAt || null,
      status,
      sortOrder,
      section: section || "Прочее",
      sectionOrder,
    };

    startTransition(async () => {
      try {
        const url = mode === "edit" ? `/api/documents/${initialData!.id}` : "/api/documents";
        const method = mode === "edit" ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");
        toast.success(mode === "edit" ? "Документ обновлён" : "Документ добавлен");
        router.push("/admin/documents");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "edit" ? "Редактировать документ" : "Новый документ"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/documents")} disabled={isPending}>
            <X className="mr-2 h-4 w-4" />Отмена
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Сохранить
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Название документа *</Label>
          <Textarea
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Полное официальное название документа"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Тип документа</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Статус</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Действующий</SelectItem>
                <SelectItem value="archived">Архивный</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="section">Раздел</Label>
          <Input
            id="section"
            list="sections-list"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="Название раздела (например: Устав, Кадровое обеспечение)"
          />
          {existingSections.length > 0 && (
            <datalist id="sections-list">
              {existingSections.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
          <p className="text-xs text-gray-400">Введите название или выберите существующий раздел</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fileUrl">Ссылка на документ (PDF / внешний ресурс)</Label>
          <Input
            id="fileUrl"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://example.ru/doc.pdf"
          />
          <p className="text-xs text-gray-400">Ссылка на файл на внешнем сервере или в хранилище</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="issuedAt">Дата принятия</Label>
            <Input id="issuedAt" type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sectionOrder">Порядок раздела</Label>
            <Input id="sectionOrder" type="number" value={sectionOrder} onChange={(e) => setSectionOrder(parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sortOrder">Порядок документа</Label>
            <Input id="sortOrder" type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} />
          </div>
        </div>
      </div>
    </div>
  );
}
