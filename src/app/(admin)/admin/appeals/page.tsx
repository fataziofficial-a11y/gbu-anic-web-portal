"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Inbox, RefreshCw, Mail } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";

// Обращения граждан с формы «Контакты» на сайте. Сотрудник отвечает человеку
// (по почте или телефону) и отмечает здесь статус и как ответили.

interface Appeal {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  adminComment: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  new: "Новое",
  in_progress: "В работе",
  answered: "Ответ дан",
  closed: "Закрыто",
};

const STATUS_COLOR: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  in_progress: "secondary",
  answered: "outline",
  closed: "outline",
};

export default function AppealsPage() {
  const [items, setItems] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState<number | null>(null);
  const [comment, setComment] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/appeals");
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Не удалось загрузить обращения"); return; }
      setItems(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(id: number, patch: { status?: string; adminComment?: string }, okText: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/appeals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? "Не сохранилось"); return; }
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...data.data } : a)));
      toast.success(okText);
    } finally {
      setBusy(null);
    }
  }

  const filtered = statusFilter === "all" ? items : items.filter((a) => a.status === statusFilter);
  const count = (s: string) => (s === "all" ? items.length : items.filter((a) => a.status === s).length);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Обращения</h1>
          <p className="text-sm text-gray-500">Сообщения посетителей с формы «Контакты» на сайте</p>
        </div>
        <Button variant="outline" size="icon" onClick={load} title="Обновить">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {(["all", "new", "in_progress", "answered", "closed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "all" ? "Все" : STATUS_LABEL[s]} <span className="ml-1 opacity-70">{count(s)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-gray-400">Загрузка…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 text-gray-400">
          <Inbox className="h-8 w-8" />
          <p className="text-sm">Обращений нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const isOpen = open === a.id;
            return (
              <div key={a.id} className="rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-4 px-4 py-3">
                  <button type="button" onClick={() => setOpen(isOpen ? null : a.id)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">#{a.id}</span>
                      <span className="text-xs text-gray-500">{a.name}</span>
                    </div>
                    <p className="truncate font-medium text-gray-900 text-sm">{a.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.email} · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: ru })}
                    </p>
                  </button>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={STATUS_COLOR[a.status] ?? "default"}>{STATUS_LABEL[a.status] ?? a.status}</Badge>
                    <Select value={a.status} onValueChange={(v) => save(a.id, { status: v }, "Статус обновлён")} disabled={busy === a.id}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Новое</SelectItem>
                        <SelectItem value="in_progress">В работе</SelectItem>
                        <SelectItem value="answered">Ответ дан</SelectItem>
                        <SelectItem value="closed">Закрыто</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                    <div className="text-xs text-gray-400">
                      Получено {format(new Date(a.createdAt), "d MMMM yyyy, HH:mm", { locale: ru })}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-800">{a.message}</p>
                    <a
                      href={`mailto:${a.email}?subject=${encodeURIComponent("Re: " + a.subject)}`}
                      className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
                    >
                      <Mail className="h-4 w-4" /> Ответить на {a.email}
                    </a>
                    <div>
                      <label htmlFor={`appeal-comment-${a.id}`} className="block text-xs text-gray-500 mb-1">
                        Комментарий сотрудника (кто и как ответил)
                      </label>
                      <textarea
                        id={`appeal-comment-${a.id}`}
                        rows={2}
                        defaultValue={a.adminComment ?? ""}
                        onChange={(e) => setComment((c) => ({ ...c, [a.id]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button
                        size="sm"
                        className="mt-2"
                        disabled={busy === a.id || comment[a.id] === undefined}
                        onClick={() => save(a.id, { adminComment: comment[a.id] ?? "" }, "Комментарий сохранён")}
                      >
                        Сохранить комментарий
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
