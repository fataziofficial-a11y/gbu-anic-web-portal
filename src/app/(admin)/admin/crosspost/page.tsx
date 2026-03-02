"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle, XCircle } from "lucide-react";

interface LogEntry {
  id: number;
  contentType: string;
  contentId: number;
  platform: string;
  status: string;
  externalPostId: string | null;
  externalUrl: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string | null;
}

const platformLabel: Record<string, string> = {
  telegram: "Telegram",
  vk: "ВКонтакте",
  dzen: "Дзен",
  ok: "Одноклассники",
  max: "MAX",
};
const contentTypeLabel: Record<string, string> = {
  news: "Новость",
  knowledge: "База знаний",
};
const statusColor: Record<string, string> = {
  sent: "default",
  failed: "destructive",
  queued: "secondary",
};

export default function CrosspostPage() {
  const [items, setItems] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/crosspost");
      const json = await res.json();
      setItems(json.data?.items ?? []);
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Send className="h-6 w-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Кросс-постинг</h1>
          <p className="text-sm text-gray-500 mt-0.5">История публикаций в социальных сетях</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <Send className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Кросс-постинга пока не было</p>
          <p className="text-xs text-gray-400 mt-1">
            Публикации появятся здесь после отправки материала в соцсети
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Материал</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Платформа</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ссылка / Ошибка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-xs text-gray-400">
                        {contentTypeLabel[item.contentType] ?? item.contentType}
                      </span>
                      <p className="text-sm font-medium text-gray-800">#{item.contentId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {platformLabel[item.platform] ?? item.platform}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {item.status === "sent" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : item.status === "failed" ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : null}
                      <Badge
                        variant={
                          (statusColor[item.status] as "default" | "destructive" | "secondary") ??
                          "secondary"
                        }
                        className="text-xs"
                      >
                        {item.status === "sent"
                          ? "Отправлено"
                          : item.status === "failed"
                          ? "Ошибка"
                          : "В очереди"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {item.sentAt
                      ? new Date(item.sentAt).toLocaleString("ru-RU")
                      : item.createdAt
                      ? new Date(item.createdAt).toLocaleString("ru-RU")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs max-w-xs">
                    {item.externalUrl ? (
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate block"
                      >
                        {item.externalUrl}
                      </a>
                    ) : item.errorMessage ? (
                      <span className="text-red-500 truncate block" title={item.errorMessage}>
                        {item.errorMessage}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
