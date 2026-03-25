"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Plus, TicketCheck, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Ticket {
  id: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
  author: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  bug: "🐛 Ошибка",
  suggestion: "💡 Пожелание",
  question: "❓ Вопрос",
};

const STATUS_LABEL: Record<string, string> = {
  new: "Новый",
  in_progress: "В работе",
  resolved: "Решён",
  closed: "Закрыт",
};

const STATUS_COLOR: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  in_progress: "secondary",
  resolved: "outline",
  closed: "outline",
};

const PRIORITY_DOT: Record<string, string> = {
  high: "🔴",
  medium: "🟡",
  low: "🟢",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      setTickets(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function changeStatus(id: number, status: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { toast.error("Ошибка обновления"); return; }
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
      toast.success("Статус обновлён");
    } finally {
      setUpdating(null);
    }
  }

  const filtered = statusFilter === "all"
    ? tickets
    : tickets.filter((t) => t.status === statusFilter);

  const counts = {
    all: tickets.length,
    new: tickets.filter((t) => t.status === "new").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  return (
    <div className="p-6">
      {/* Шапка */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Тикеты</h1>
          <p className="text-sm text-gray-500">Обратная связь и сообщения об ошибках от сотрудников</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} title="Обновить">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/admin/tickets/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Новый тикет
            </Button>
          </Link>
        </div>
      </div>

      {/* Фильтры */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {(["all", "new", "in_progress", "resolved", "closed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "all" ? "Все" : STATUS_LABEL[s]}{" "}
            <span className="ml-1 opacity-70">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Список */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-gray-400">
          Загрузка…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 text-gray-400">
          <TicketCheck className="h-8 w-8" />
          <p className="text-sm">Тикетов нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 transition-colors"
            >
              {/* Приоритет */}
              <span className="text-base" title={ticket.priority}>
                {PRIORITY_DOT[ticket.priority] ?? ""}
              </span>

              {/* Тип + заголовок */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">#{ticket.id}</span>
                  <span className="text-xs text-gray-500">{TYPE_LABEL[ticket.type] ?? ticket.type}</span>
                </div>
                <p className="truncate font-medium text-gray-900 text-sm">{ticket.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {ticket.author ?? "—"} ·{" "}
                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: ru })}
                </p>
              </div>

              {/* Статус + смена */}
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={STATUS_COLOR[ticket.status] ?? "default"}>
                  {STATUS_LABEL[ticket.status] ?? ticket.status}
                </Badge>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => changeStatus(ticket.id, v)}
                  disabled={updating === ticket.id}
                >
                  <SelectTrigger className="h-7 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Новый</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="resolved">Решён</SelectItem>
                    <SelectItem value="closed">Закрыт</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
