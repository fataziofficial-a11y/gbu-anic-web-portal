"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tag, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { KbCategoryDialog } from "./KbCategoryDialog";

interface Category {
  id: number;
  name: string;
  sortOrder: number | null;
}

export function KnowledgeCategoriesManager() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [, startDeleteTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kb-categories");
      const json = await res.json();
      setCategories(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  function handleDelete(id: number) {
    if (!confirm("Удалить категорию? Статьи останутся, но потеряют категорию.")) return;
    startDeleteTransition(async () => {
      const res = await fetch(`/api/kb-categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Ошибка удаления");
      } else {
        toast.success("Категория удалена");
        load();
      }
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Tag className="mr-2 h-4 w-4" />
        Категории
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Категории базы знаний</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Категорий пока нет</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                {categories.map((cat) => (
                  <li key={cat.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                    <span className="text-sm text-gray-900">{cat.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-gray-700"
                        onClick={() => { setEditTarget({ ...cat, sortOrder: cat.sortOrder ?? 0 }); }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-600"
                        onClick={() => handleDelete(cat.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Добавить категорию
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог создания */}
      <KbCategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={load}
      />

      {/* Диалог редактирования */}
      {editTarget && (
        <KbCategoryDialog
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(undefined); }}
          initialData={editTarget}
          onSuccess={() => { setEditTarget(undefined); load(); }}
        />
      )}
    </>
  );
}
