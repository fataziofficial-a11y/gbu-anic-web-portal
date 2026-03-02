"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
import { Badge } from "@/components/ui/badge";

const TiptapEditor = dynamic(
  () => import("./TiptapEditor").then((m) => ({ default: m.TiptapEditor })),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded-lg border border-gray-200" /> }
);
import { Loader2, Save, X, Globe } from "lucide-react";

interface Option {
  id: number;
  name: string;
}

interface KnowledgeFormData {
  id?: number;
  title?: string;
  content?: Record<string, unknown>;
  categoryId?: number | null;
  departmentId?: number | null;
  tags?: string[];
  status?: string;
  slug?: string;
}

interface Props {
  initialData?: KnowledgeFormData;
  mode: "create" | "edit";
  categories: Option[];
  departments: Option[];
}

export function KnowledgeForm({ initialData, mode, categories, departments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState<Record<string, unknown>>(
    (initialData?.content as Record<string, unknown>) ?? {}
  );
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.categoryId ? String(initialData.categoryId) : "none"
  );
  const [departmentId, setDepartmentId] = useState<string>(
    initialData?.departmentId ? String(initialData.departmentId) : "none"
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState(initialData?.status ?? "draft");

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) setTags([...tags, tag]);
      setTagInput("");
    }
  }

  async function handleSave(publishNow?: boolean) {
    if (!title.trim()) {
      toast.error("Заголовок обязателен");
      return;
    }

    const payload = {
      title: title.trim(),
      content,
      categoryId: categoryId !== "none" ? parseInt(categoryId) : null,
      departmentId: departmentId !== "none" ? parseInt(departmentId) : null,
      tags,
      status: publishNow ? "published" : status,
    };

    startTransition(async () => {
      try {
        const url =
          mode === "edit"
            ? `/api/knowledge/${initialData!.id}`
            : "/api/knowledge";
        const method = mode === "edit" ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");

        toast.success(mode === "edit" ? "Статья обновлена" : "Статья создана");
        router.push("/admin/knowledge");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "edit" ? "Редактировать статью" : "Новая статья базы знаний"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {status === "published" ? "Опубликовано" : "Черновик"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/knowledge")} disabled={isPending}>
            <X className="mr-2 h-4 w-4" />
            Отмена
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Сохранить
          </Button>
          {status !== "published" && (
            <Button onClick={() => handleSave(true)} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
              Опубликовать
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Заголовок *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите заголовок статьи"
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Содержимое</Label>
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder="Начните писать статью..."
              minHeight={400}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Статус</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Черновик</SelectItem>
                <SelectItem value="published">Опубликовано</SelectItem>
                <SelectItem value="archived">Архив</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Категория</p>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Без категории —</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
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
            <p className="text-sm font-medium text-gray-700">Теги</p>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Введите тег и нажмите Enter"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100 hover:text-red-700 text-xs"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">Нажмите Enter для добавления</p>
          </div>
        </div>
      </div>
    </div>
  );
}
