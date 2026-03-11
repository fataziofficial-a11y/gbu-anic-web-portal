"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock, RefreshCw, ExternalLink } from "lucide-react";

const ALL_PLATFORMS = [
  { id: "telegram", label: "Telegram" },
  { id: "vk",       label: "ВКонтакте" },
  { id: "max",      label: "MAX" },
  { id: "dzen",     label: "Яндекс.Дзен" },
  { id: "ok",       label: "Одноклассники" },
] as const;

type Platform = typeof ALL_PLATFORMS[number]["id"];

interface LogEntry {
  id: number;
  platform: string;
  status: string;
  externalPostId?: string | null;
  externalUrl?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

interface Props {
  newsId: number;
  /** Показываем только если новость опубликована */
  isPublished: boolean;
}

export function CrosspostPanel({ newsId, isPublished }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crosspost?contentType=news&contentId=${newsId}`);
      const json = await res.json();
      if (res.ok) setLogs(json.data?.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [newsId]);

  useEffect(() => {
    if (isPublished) loadLogs();
  }, [isPublished, loadLogs]);

  async function retry(platform: Platform) {
    setRetrying(platform);
    try {
      const res = await fetch("/api/crosspost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: "news", contentId: newsId, platforms: [platform] }),
      });
      const json = await res.json();
      const result = json.data?.results?.[0];
      if (result?.ok) {
        toast.success(`Опубликовано в ${ALL_PLATFORMS.find(p => p.id === platform)?.label}`);
      } else {
        toast.error(`Ошибка: ${result?.error ?? "Неизвестная ошибка"}`);
      }
      await loadLogs();
    } catch {
      toast.error("Сетевая ошибка");
    } finally {
      setRetrying(null);
    }
  }

  if (!isPublished) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
        <p className="text-sm font-medium text-gray-700">Кросс-постинг</p>
        <p className="text-xs text-gray-400">Доступно после публикации новости</p>
      </div>
    );
  }

  // Для каждой платформы берём последнюю запись лога
  const latestByPlatform = new Map<string, LogEntry>();
  for (const entry of logs) {
    if (!latestByPlatform.has(entry.platform)) {
      latestByPlatform.set(entry.platform, entry);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Кросс-постинг</p>
        <button
          onClick={loadLogs}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Обновить статусы"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-2">
        {ALL_PLATFORMS.map((p) => {
          const entry = latestByPlatform.get(p.id);
          const isSent = entry?.status === "sent";
          const isFailed = entry?.status === "failed";
          const isRetrying = retrying === p.id;

          return (
            <div key={p.id} className="flex items-center justify-between gap-2 py-1">
              <div className="flex items-center gap-2 min-w-0">
                {isSent ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                ) : isFailed ? (
                  <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0 text-gray-300" />
                )}
                <span className="text-sm text-gray-700">{p.label}</span>
                {isFailed && entry?.errorMessage && (
                  <span className="text-xs text-red-400 truncate max-w-[100px]" title={entry.errorMessage}>
                    {entry.errorMessage.slice(0, 30)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isSent && entry?.externalUrl && (
                  <a
                    href={entry.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                    title="Открыть пост"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {(!entry || isFailed) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    disabled={isRetrying}
                    onClick={() => retry(p.id)}
                  >
                    {isRetrying ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isFailed ? (
                      "Повторить"
                    ) : (
                      "Опубликовать"
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
