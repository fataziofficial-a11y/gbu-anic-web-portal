"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Trash2, Plus, Settings2 } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const MANAGE_VALUE = "__manage__";

export function NewsCategorySelect({ value, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Состояние диалога управления
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/news-categories");
      const json = await res.json();
      if (res.ok) setCategories(json.data?.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCategories(); }, []);

  async function addCategory() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/news-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      setNewName("");
      toast.success("Категория добавлена");
      await loadCategories();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setAdding(false);
    }
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/news-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      // если редактировали текущую выбранную — обновить
      const old = categories.find((c) => c.id === id);
      if (old && value === old.name) onChange(editName.trim());
      setEditingId(null);
      toast.success("Сохранено");
      await loadCategories();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id: number, name: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/news-categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      if (value === name) onChange("");
      toast.success("Категория удалена");
      await loadCategories();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSelectChange(val: string) {
    if (val === MANAGE_VALUE) {
      setDialogOpen(true);
    } else {
      onChange(val);
    }
  }

  return (
    <>
      <Select value={value || ""} onValueChange={handleSelectChange}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Загрузка..." : "Выберите категорию"} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.name}>
              {cat.name}
            </SelectItem>
          ))}
          {categories.length === 0 && !loading && (
            <div className="px-3 py-2 text-xs text-gray-400">Нет категорий</div>
          )}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <SelectItem value={MANAGE_VALUE} className="text-blue-600 font-medium">
              <div className="flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5" />
                Управление категориями...
              </div>
            </SelectItem>
          </div>
        </SelectContent>
      </Select>

      {/* Диалог управления категориями */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Управление категориями</DialogTitle>
          </DialogHeader>

          {/* Список категорий */}
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50">
                {editingId === cat.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(cat.id); if (e.key === "Escape") setEditingId(null); }}
                      className="h-7 text-sm flex-1"
                      autoFocus
                    />
                    <Button size="sm" className="h-7 px-2 text-xs" disabled={saving} onClick={() => saveEdit(cat.id)}>
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingId(null)}>
                      ✕
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
                    <button
                      className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                      title="Переименовать"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      onClick={() => deleteCategory(cat.id, cat.name)}
                      disabled={deletingId === cat.id}
                      title="Удалить"
                    >
                      {deletingId === cat.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-gray-400 px-2 py-3">Категорий пока нет</p>
            )}
          </div>

          {/* Добавить новую */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
              placeholder="Новая категория..."
              className="h-8 text-sm"
            />
            <Button size="sm" className="h-8 shrink-0" disabled={adding || !newName.trim()} onClick={addCategory}>
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
