"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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

const TiptapEditor = dynamic(
  () => import("./TiptapEditor").then((m) => ({ default: m.TiptapEditor })),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded-lg border border-gray-200" /> }
);
import { Loader2, Save, X, Globe } from "lucide-react";

interface PageOption {
  id: number;
  title: string;
}

interface PageFormData {
  id?: number;
  title?: string;
  content?: Record<string, unknown>;
  parentId?: number | null;
  sortOrder?: number;
  template?: string;
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
}

interface Props {
  initialData?: PageFormData;
  mode: "create" | "edit";
  pages: PageOption[];
}

export function PageForm({ initialData, mode, pages }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState<Record<string, unknown>>(
    (initialData?.content as Record<string, unknown>) ?? {}
  );
  const [parentId, setParentId] = useState<string>(
    initialData?.parentId ? String(initialData.parentId) : "none"
  );
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0);
  const [template, setTemplate] = useState(initialData?.template ?? "default");
  const [status, setStatus] = useState(initialData?.status ?? "draft");
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialData?.seoDescription ?? ""
  );

  async function handleSave(publishNow?: boolean) {
    if (!title.trim()) {
      toast.error("Заголовок обязателен");
      return;
    }

    const payload = {
      title: title.trim(),
      content,
      parentId: parentId !== "none" ? parseInt(parentId) : null,
      sortOrder,
      template,
      status: publishNow ? "published" : status,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
    };

    startTransition(async () => {
      try {
        const url = mode === "edit" ? `/api/pages/${initialData!.id}` : "/api/pages";
        const method = mode === "edit" ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");

        toast.success(mode === "edit" ? "Страница обновлена" : "Страница создана");
        router.push("/admin/pages");
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
            {mode === "edit" ? "Редактировать страницу" : "Новая страница"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {status === "published" ? "Опубликовано" : "Черновик"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/pages")} disabled={isPending}>
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
              placeholder="Введите заголовок страницы"
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Содержимое страницы</Label>
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder="Начните писать текст страницы..."
              minHeight={400}
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">SEO</p>
            <div className="space-y-1.5">
              <Label htmlFor="seoTitle" className="text-xs">SEO-заголовок</Label>
              <Input
                id="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Заголовок для поисковиков"
                maxLength={500}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seoDescription" className="text-xs">SEO-описание</Label>
              <Textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Meta description (160–200 символов)"
                rows={2}
                maxLength={300}
              />
            </div>
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
            <p className="text-sm font-medium text-gray-700">Шаблон</p>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">По умолчанию</SelectItem>
                <SelectItem value="about">О нас</SelectItem>
                <SelectItem value="contacts">Контакты</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Родительская страница</p>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="Нет (корневая)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Нет (корневая) —</SelectItem>
                {pages
                  .filter((p) => p.id !== initialData?.id)
                  .map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <Label htmlFor="sortOrder">Порядок сортировки</Label>
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
