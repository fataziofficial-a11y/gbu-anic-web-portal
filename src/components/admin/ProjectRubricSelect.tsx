"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  useEffect(() => {
    if (!projectId) {
      setRubrics([]);
      return;
    }
    setLoadingRubrics(true);
    fetch(`/api/project-rubrics?projectId=${projectId}`)
      .then((r) => r.json())
      .then((json) => setRubrics(json.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoadingRubrics(false));
  }, [projectId]);

  function handleProjectChange(val: string) {
    onProjectChange(val === NONE ? null : parseInt(val));
  }

  function handleRubricChange(val: string) {
    onRubricChange(val === NONE ? null : parseInt(val));
  }

  return (
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

      {/* Рубрика — показывать только если выбран проект */}
      {projectId && (
        <Select
          value={rubricId ? String(rubricId) : NONE}
          onValueChange={handleRubricChange}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={loadingRubrics ? "Загрузка..." : rubrics.length === 0 ? "Нет рубрик" : "Выберите рубрику"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>— Без рубрики —</SelectItem>
            {rubrics.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
