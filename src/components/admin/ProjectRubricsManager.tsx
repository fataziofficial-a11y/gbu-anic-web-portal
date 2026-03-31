"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Pencil, Trash2, GripVertical } from "lucide-react";

interface Rubric {
  id: number;
  name: string;
  slug: string;
  sortOrder: number | null;
}

interface Props {
  projectId: number;
  initialRubrics: Rubric[];
}

export function ProjectRubricsManager({ projectId, initialRubrics }: Props) {
  const [rubrics, setRubrics] = useState<Rubric[]>(initialRubrics);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function addRubric() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/project-rubrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, name: newName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      setRubrics((prev) => [...prev, json.data]);
      setNewName("");
      toast.success("Рубрика добавлена");
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
      const res = await fetch(`/api/project-rubrics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      setRubrics((prev) => prev.map((r) => (r.id === id ? json.data : r)));
      setEditingId(null);
      toast.success("Сохранено");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRubric(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/project-rubrics/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      setRubrics((prev) => prev.filter((r) => r.id !== id));
      toast.success("Рубрика удалена");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {rubrics.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">Рубрик пока нет</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {rubrics.map((rubric) => (
            <div key={rubric.id} className="flex items-center gap-2 px-4 py-3">
              <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
              {editingId === rubric.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(rubric.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-7 text-sm flex-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={saving}
                    onClick={() => saveEdit(rubric.id)}
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => setEditingId(null)}
                  >
                    ✕
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-800">{rubric.name}</span>
                  <button
                    className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                    onClick={() => { setEditingId(rubric.id); setEditName(rubric.name); }}
                    title="Переименовать"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    onClick={() => deleteRubric(rubric.id)}
                    disabled={deletingId === rubric.id}
                    title="Удалить"
                  >
                    {deletingId === rubric.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Добавить рубрику */}
      <div className="flex gap-2 p-3 border-t border-gray-100 bg-gray-50">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addRubric(); }}
          placeholder="Новая рубрика..."
          className="h-8 text-sm bg-white"
        />
        <Button
          size="sm"
          className="h-8 shrink-0"
          disabled={adding || !newName.trim()}
          onClick={addRubric}
        >
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
