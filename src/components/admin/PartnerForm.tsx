"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X } from "lucide-react";
import { ImageCropUploader } from "@/components/admin/ImageCropUploader";

interface PartnerFormData {
  id?: number;
  name?: string;
  logoId?: number | null;
  logo?: { id: number; url: string } | null;
  description?: string | null;
  services?: string | null;
  websiteUrl?: string | null;
  sortOrder?: number;
}

interface Props {
  initialData?: PartnerFormData;
  mode: "create" | "edit";
}

export function PartnerForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialData?.name ?? "");
  const [logo, setLogo] = useState<{ id: number; url: string } | null>(
    initialData?.logo ?? null
  );
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [services, setServices] = useState(initialData?.services ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.websiteUrl ?? "");
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0);

  async function handleSave() {
    if (!name.trim()) { toast.error("Название обязательно"); return; }

    const payload = {
      name: name.trim(),
      logoId: logo?.id ?? null,
      description: description || null,
      services: services || null,
      websiteUrl: websiteUrl || null,
      projectIds: [],
      sortOrder,
    };

    startTransition(async () => {
      try {
        const url = mode === "edit" ? `/api/partners/${initialData!.id}` : "/api/partners";
        const method = mode === "edit" ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");
        toast.success(mode === "edit" ? "Партнёр обновлён" : "Партнёр добавлен");
        router.push("/admin/partners");
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
          {mode === "edit" ? "Редактировать партнёра" : "Новый партнёр"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/partners")} disabled={isPending}>
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
          <Label htmlFor="name">Название организации *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ООО Арктик Ресёрч" />
        </div>

        <div className="space-y-1.5">
          <Label>Логотип</Label>
          <ImageCropUploader
            value={logo}
            onChange={setLogo}
            aspect={1}
            outputWidth={400}
            outputHeight={400}
            hint="Логотип 400×400 px (квадрат)"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="websiteUrl">Сайт организации</Label>
          <Input id="websiteUrl" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.ru" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Описание сотрудничества</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание партнёра и направлений сотрудничества..."
            rows={4}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="services">Услуги / проекты</Label>
          <Textarea
            id="services"
            value={services}
            onChange={(e) => setServices(e.target.value)}
            placeholder="Перечислите проекты или услуги в рамках сотрудничества..."
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sortOrder">Порядок отображения</Label>
          <Input id="sortOrder" type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} />
        </div>
      </div>
    </div>
  );
}
