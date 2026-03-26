"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
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
import { Loader2, Save, X, Upload, FileText, Trash2, Link as LinkIcon } from "lucide-react";

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
  fileId?: number | null;
  fileUrl?: string | null;
  issuedAt?: string | null;
  status?: string;
  sortOrder?: number;
  section?: string | null;
  sectionOrder?: number;
  file?: { id: number; url: string; originalName: string } | null;
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
  const [fileId, setFileId] = useState<number | null>(initialData?.fileId ?? null);
  const [fileName, setFileName] = useState(initialData?.file?.originalName ?? "");
  const [issuedAt, setIssuedAt] = useState(initialData?.issuedAt ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "active");
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0);
  const [section, setSection] = useState(initialData?.section ?? "");
  const [sectionOrder, setSectionOrder] = useState(initialData?.sectionOrder ?? 0);
  const [existingSections, setExistingSections] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(!!initialData?.fileUrl && !initialData?.fileId);
  const [newSection, setNewSection] = useState("");
  const [showNewSection, setShowNewSection] = useState(false);

  useEffect(() => {
    fetch("/api/documents/sections")
      .then((r) => r.json())
      .then((json) => { if (Array.isArray(json.data)) setExistingSections(json.data); })
      .catch(() => {});
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "documents");
      const res = await fetch("/api/files", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка загрузки");
      const uploaded = json.data;
      setFileId(uploaded.id);
      setFileName(uploaded.originalName);
      setFileUrl(uploaded.url);
      setShowUrlInput(false);
      toast.success("Файл загружен");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const clearFile = () => {
    setFileId(null);
    setFileName("");
    if (!showUrlInput) setFileUrl("");
  };

  async function handleSave() {
    if (!title.trim()) { toast.error("Название обязательно"); return; }

    const finalSection = showNewSection ? newSection.trim() : section;
    if (!finalSection) { toast.error("Выберите или создайте раздел"); return; }

    const payload = {
      title: title.trim(),
      docType,
      fileId: fileId || null,
      fileUrl: fileUrl || null,
      issuedAt: issuedAt || null,
      status,
      sortOrder,
      section: finalSection || "Прочее",
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

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Раздел */}
        <div className="space-y-1.5">
          <Label>Раздел *</Label>
          {!showNewSection ? (
            <div className="flex gap-2">
              <Select
                value={section}
                onValueChange={(v) => { setSection(v); setShowNewSection(false); }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Выберите раздел..." />
                </SelectTrigger>
                <SelectContent>
                  {existingSections.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewSection(true)}
                className="shrink-0"
              >
                + Новый
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder="Название нового раздела"
                className="flex-1"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setShowNewSection(false); setNewSection(""); }}
                className="shrink-0"
              >
                Отмена
              </Button>
            </div>
          )}
        </div>

        {/* Название */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Название документа *</Label>
          <Textarea
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Полное официальное название документа"
            rows={2}
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

        {/* Файл — загрузка или URL */}
        <div className="space-y-2">
          <Label>Файл документа</Label>

          {fileId && fileName ? (
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <FileText className="h-5 w-5 text-blue-600 shrink-0" />
              <span className="flex-1 text-sm font-medium text-gray-900 truncate">{fileName}</span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={clearFile}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : !showUrlInput ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-8 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-center">
                    <label className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-800">
                      Выберите файл
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.ods,.rtf,.txt"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                      />
                    </label>
                    <span className="text-sm text-gray-500"> или перетащите сюда</span>
                    <p className="mt-1 text-xs text-gray-400">PDF, DOC, DOCX, XLS, XLSX до 50 МБ</p>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {showUrlInput && !fileId && (
            <div className="space-y-1.5">
              <Input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://example.ru/document.pdf"
              />
              <p className="text-xs text-gray-400">Ссылка на файл на внешнем сервере</p>
            </div>
          )}

          <div className="flex gap-2">
            {!fileId && (
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1"
              >
                <LinkIcon className="h-3 w-3" />
                {showUrlInput ? "Загрузить файл" : "Указать внешнюю ссылку"}
              </button>
            )}
          </div>
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
