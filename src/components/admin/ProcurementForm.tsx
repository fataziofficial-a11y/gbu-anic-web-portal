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

interface ProcurementFormData {
  id?: number;
  title?: string;
  description?: string | null;
  eisUrl?: string | null;
  publishedAt?: string | null;
  deadline?: string | null;
  amount?: string | null;
  status?: string;
}

interface Props {
  initialData?: ProcurementFormData;
  mode: "create" | "edit";
}

export function ProcurementForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [eisUrl, setEisUrl] = useState(initialData?.eisUrl ?? "");
  const [publishedAt, setPublishedAt] = useState(initialData?.publishedAt ?? "");
  const [deadline, setDeadline] = useState(initialData?.deadline ?? "");
  const [amount, setAmount] = useState(initialData?.amount ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "open");

  async function handleSave() {
    if (!title.trim()) { toast.error("Название обязательно"); return; }

    const payload = {
      title: title.trim(),
      description: description || null,
      eisUrl: eisUrl || null,
      publishedAt: publishedAt || null,
      deadline: deadline || null,
      amount: amount || null,
      status,
    };

    startTransition(async () => {
      try {
        const url = mode === "edit" ? `/api/procurements/${initialData!.id}` : "/api/procurements";
        const method = mode === "edit" ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");
        toast.success(mode === "edit" ? "Закупка обновлена" : "Закупка добавлена");
        router.push("/admin/procurements");
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
          {mode === "edit" ? "Редактировать закупку" : "Новая закупка"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/procurements")} disabled={isPending}>
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
          <Label htmlFor="title">Предмет закупки *</Label>
          <Textarea
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Полное наименование предмета закупки"
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Дополнительная информация о закупке..."
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="eisUrl">Ссылка на ЕИС</Label>
          <Input
            id="eisUrl"
            value={eisUrl}
            onChange={(e) => setEisUrl(e.target.value)}
            placeholder="https://zakupki.gov.ru/..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Начальная цена</Label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1 500 000 ₽"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Статус</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Открыта</SelectItem>
                <SelectItem value="closed">Завершена</SelectItem>
                <SelectItem value="cancelled">Отменена</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="publishedAt">Дата публикации</Label>
            <Input id="publishedAt" type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deadline">Срок подачи заявок</Label>
            <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
