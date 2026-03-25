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
import { Loader2, Save, X, Wand2 } from "lucide-react";
import { ImageCropUploader } from "@/components/admin/ImageCropUploader";

interface MediaFormData {
  id?: number;
  title?: string;
  description?: string | null;
  type?: "video" | "photo";
  videoUrl?: string | null;
  thumbnailId?: number | null;
  thumbnail?: { id: number; url: string } | null;
  eventDate?: string | null;
  status?: string;
}

interface Props {
  initialData?: MediaFormData;
  mode: "create" | "edit";
}

export function MediaForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [type, setType] = useState<"video" | "photo">(initialData?.type ?? "video");
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl ?? "");
  const [thumbnail, setThumbnail] = useState<{ id: number; url: string } | null>(
    initialData?.thumbnail ?? null
  );
  const [eventDate, setEventDate] = useState(initialData?.eventDate ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "published");
  const [fetching, setFetching] = useState(false);

  /** Автозаполнение по ссылке Rutube/VK */
  async function handleFetchMeta() {
    if (!videoUrl.trim()) { toast.error("Введите ссылку на видео"); return; }
    setFetching(true);
    try {
      const res = await fetch(`/api/media/fetch-meta?url=${encodeURIComponent(videoUrl.trim())}`);
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Ошибка получения данных"); return; }
      const meta = json.data;
      if (meta.title && !title) setTitle(meta.title);
      else if (meta.title) setTitle(meta.title); // перезаписываем
      if (meta.description) setDescription(meta.description);
      if (meta.embedUrl) setVideoUrl(meta.embedUrl);
      if (meta.eventDate) setEventDate(meta.eventDate);
      if (meta.thumbnailId && meta.thumbnailUrl) {
        setThumbnail({ id: meta.thumbnailId, url: meta.thumbnailUrl });
      }
      toast.success("Данные загружены");
    } catch {
      toast.error("Не удалось загрузить метаданные");
    } finally {
      setFetching(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Название обязательно"); return; }

    const payload = {
      title: title.trim(),
      description: description || null,
      type,
      videoUrl: type === "video" ? (videoUrl || null) : null,
      thumbnailId: thumbnail?.id ?? null,
      eventDate: eventDate || null,
      status,
    };

    startTransition(async () => {
      try {
        const url = mode === "edit" ? `/api/media/${initialData!.id}` : "/api/media";
        const method = mode === "edit" ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");
        toast.success(mode === "edit" ? "Медиа обновлено" : "Медиа добавлено");
        router.push("/admin/media");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  // Определяем, является ли videoUrl embed-ссылкой для превью
  const isEmbed = videoUrl.includes("/embed/") || videoUrl.includes("video_ext.php");

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "edit" ? "Редактировать медиа" : "Новый медиа-материал"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/media")} disabled={isPending}>
            <X className="mr-2 h-4 w-4" />Отмена
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Сохранить
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Тип</Label>
            <Select value={type} onValueChange={(v) => setType(v as "video" | "photo")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Видео</SelectItem>
                <SelectItem value="photo">Фотоотчёт</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Статус</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Опубликовано</SelectItem>
                <SelectItem value="draft">Черновик</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {type === "video" && (
          <div className="space-y-1.5">
            <Label htmlFor="videoUrl">Ссылка на видео (Rutube / VK)</Label>
            <div className="flex gap-2">
              <Input
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://rutube.ru/video/... или https://vk.com/video..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchMeta}
                disabled={fetching || !videoUrl.trim()}
                title="Загрузить название, описание и превью автоматически"
              >
                {fetching
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Wand2 className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Заполнить</span>
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Вставьте ссылку и нажмите «Заполнить» — название, описание и превью загрузятся автоматически
            </p>

            {/* Превью embed */}
            {isEmbed && videoUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 bg-black aspect-video">
                <iframe
                  src={videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="encrypted-media"
                  frameBorder="0"
                />
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="title">Название *</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название видео или фотоотчёта" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="eventDate">Дата мероприятия</Label>
          <Input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Превью / Обложка</Label>
          <ImageCropUploader value={thumbnail} onChange={setThumbnail} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}
