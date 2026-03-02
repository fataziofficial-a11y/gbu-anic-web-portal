"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface DepartmentData {
  id?: number;
  name?: string;
  description?: string;
  sortOrder?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: DepartmentData;
  onSuccess?: () => void;
}

export function DepartmentDialog({ open, onOpenChange, initialData, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0);

  const mode = initialData?.id ? "edit" : "create";

  function handleClose() {
    onOpenChange(false);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Название обязательно");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description || undefined,
      sortOrder,
    };

    startTransition(async () => {
      try {
        const url = mode === "edit" ? `/api/departments/${initialData!.id}` : "/api/departments";
        const method = mode === "edit" ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");

        toast.success(mode === "edit" ? "Подразделение обновлено" : "Подразделение создано");
        handleClose();
        onSuccess?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Редактировать подразделение" : "Новое подразделение"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="dept-name">Название *</Label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Лаборатория арктических исследований"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept-desc">Описание</Label>
            <Textarea
              id="dept-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание подразделения..."
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept-sort">Порядок сортировки</Label>
            <Input
              id="dept-sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "edit" ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
