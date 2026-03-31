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

interface Project {
  id: number;
  title: string;
}

interface Rubric {
  id: number;
  name: string;
}

interface Props {
  projectId: number | null;
  rubricId: number | null;
  onProjectChange: (id: number | null) => void;
  onRubricChange: (id: number | null) => void;
}

const NONE = "__none__";
const MANAGE = "__manage__";

export function ProjectRubricSelect({
  projectId,
  rubricId,
  onProjectChange,
  onRubricChange,
}: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingRubrics, setLoadingRubrics] = useState(false);

  // Диалог управления рубриками
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Загрузить проекты
  useEffect(() => {
    setLoadingProjects(true);
    fetch("/api/projects")
      .then((r) => r.json())
      .then((json) => setProjects(json.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, []);

  // Загрузить рубрики при смене проекта
  async function loadRubrics() {
    if (!projectId) { setRubrics([]); return; }
    setLoadingRubrics(true);
    try {
      const res = await fetch(`/api/project-rubrics?projectId=${projectId}`);
      const json = await res.json();
      setRubrics(json.data?.items ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingRubrics(false);
    }
  }

  useEffect(() => { loadRubrics(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleProjectChange(val: string) {
    onProjectChange(val === NONE ? null : parseInt(val));
  }

  function handleRubricChange(val: string) {
    if (val === MANAGE) { setDialogOpen(true); return; }
    onRubricChange(val === NONE ? null : parseInt(val));
  }

  async function addRubric() {
    if (!newName.trim() || !projectId) return;
    setAdding(true);
    try {
      const res = await fetch("/api/project-rubrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, name: newName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      setNewName("");
      toast.success("Рубрика добавлена");
      await loadRubrics();
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
      // Если редактировали выбранную — сбросить выбор (id не меняется, но на всякий случай)
      setEditingId(null);
      toast.success("Сохранено");
      await loadRubrics();
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
      if (rubricId === id) onRubricChange(null);
      toast.success("Рубрика удалена");
      await loadRubrics();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="space-y-2">
        {/* Проект */}
        <Select
          value={projectId ? String(projectId) : NONE}
          onValueChange={handleProjectChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingProjects ? "Загрузка..." : "Выберите проект"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>— Без проекта —</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Рубрика — только если выбран проект */}
        {projectId && (
          <Select
            value={rubricId ? String(rubricId) : NONE}
            onValueChange={handleRubricChange}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loadingRubrics ? "Загрузка..." :
                  rubrics.length === 0 ? "Нет рубрик — создайте" :
                  "Выберите рубрику"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>— Без рубрики —</SelectItem>
              {rubrics.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <SelectItem value={MANAGE} className="text-blue-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-3.5 w-3.5" />
                    Управление рубриками...
                  </div>
                </SelectItem>
              </div>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Диалог управления рубриками */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Рубрики проекта</DialogTitle>
          </DialogHeader>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {rubrics.map((r) => (
              <div key={r.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50">
                {editingId === r.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(r.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-7 text-sm flex-1"
                      autoFocus
                    />
                    <Button size="sm" className="h-7 px-2 text-xs" disabled={saving} onClick={() => saveEdit(r.id)}>
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingId(null)}>
                      ✕
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-700">{r.name}</span>
                    <button
                      className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                      onClick={() => { setEditingId(r.id); setEditName(r.name); }}
                      title="Переименовать"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      onClick={() => deleteRubric(r.id)}
                      disabled={deletingId === r.id}
                      title="Удалить"
                    >
                      {deletingId === r.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </>
                )}
              </div>
            ))}
            {rubrics.length === 0 && (
              <p className="text-sm text-gray-400 px-2 py-3">Рубрик пока нет</p>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addRubric(); }}
              placeholder="Новая рубрика..."
              className="h-8 text-sm"
            />
            <Button size="sm" className="h-8 shrink-0" disabled={adding || !newName.trim()} onClick={addRubric}>
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
