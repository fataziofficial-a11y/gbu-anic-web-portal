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
import { Loader2, Save, X, ExternalLink } from "lucide-react";

interface Option { id: number; name: string; }

interface PubFormData {
  id?: number;
  title?: string;
  authors?: string;
  abstract?: string;
  year?: number | null;
  journal?: string;
  doi?: string;
  departmentId?: number | null;
}

interface Props {
  initialData?: PubFormData;
  mode: "create" | "edit";
  departments: Option[];
}

const currentYear = new Date().getFullYear();

export function PublicationForm({ initialData, mode, departments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [authors, setAuthors] = useState(initialData?.authors ?? "");
  const [abstract, setAbstract] = useState(initialData?.abstract ?? "");
  const [year, setYear] = useState<string>(initialData?.year ? String(initialData.year) : String(currentYear));
  const [journal, setJournal] = useState(initialData?.journal ?? "");
  const [doi, setDoi] = useState(initialData?.doi ?? "");
  const [departmentId, setDepartmentId] = useState<string>(
    initialData?.departmentId ? String(initialData.departmentId) : "none"
  );

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Название обязательно");
      return;
    }

    const payload = {
      title: title.trim(),
      authors: authors || undefined,
      abstract: abstract || undefined,
      year: year ? parseInt(year) : null,
      journal: journal || undefined,
      doi: doi || undefined,
      departmentId: departmentId !== "none" ? parseInt(departmentId) : null,
    };

    startTransition(async () => {
      try {
        const url = mode === "edit" ? `/api/publications/${initialData!.id}` : "/api/publications";
        const method = mode === "edit" ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");

        toast.success(mode === "edit" ? "Публикация обновлена" : "Публикация добавлена");
        router.push("/admin/publications");
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
          {mode === "edit" ? "Редактировать публикацию" : "Новая публикация"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/publications")} disabled={isPending}>
            <X className="mr-2 h-4 w-4" />
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Сохранить
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Название публикации *</Label>
          <Textarea
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Полное название статьи или монографии"
            rows={3}
            className="text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="authors">Авторы</Label>
          <Input
            id="authors"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            placeholder="Иванов И.И., Петрова А.А., Сидоров В.В."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="journal">Журнал / Издание</Label>
            <Input
              id="journal"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="Arctic Science Review"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year">Год публикации</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min={1900}
              max={currentYear + 2}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="doi">DOI / Ссылка</Label>
          <div className="flex gap-2">
            <Input
              id="doi"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="10.1234/example.2024 или https://..."
              className="flex-1"
            />
            {doi && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                asChild
              >
                <a
                  href={doi.startsWith("http") ? doi : `https://doi.org/${doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="abstract">Аннотация</Label>
          <Textarea
            id="abstract"
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            placeholder="Краткое содержание публикации..."
            rows={5}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Подразделение</Label>
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите подразделение" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Не привязано —</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
