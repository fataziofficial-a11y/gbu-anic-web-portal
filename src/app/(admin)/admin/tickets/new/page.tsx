"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "bug",
    priority: "medium",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Заполните заголовок и описание");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Ошибка при отправке");
        return;
      }
      toast.success("Тикет отправлен!");
      router.push("/admin/tickets");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Новый тикет</h1>
          <p className="text-sm text-gray-500">Сообщите об ошибке или предложите улучшение</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">Заголовок *</Label>
          <Input
            id="title"
            placeholder="Кратко опишите проблему или пожелание"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Тип</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">🐛 Ошибка</SelectItem>
                <SelectItem value="suggestion">💡 Пожелание</SelectItem>
                <SelectItem value="question">❓ Вопрос</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Приоритет</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">🔴 Высокий</SelectItem>
                <SelectItem value="medium">🟡 Средний</SelectItem>
                <SelectItem value="low">🟢 Низкий</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Описание *</Label>
          <Textarea
            id="description"
            placeholder="Подробно опишите: что происходит, как воспроизвести, что ожидали получить..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={6}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/tickets">
            <Button variant="outline" type="button">Отмена</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Отправка..." : "Отправить тикет"}
          </Button>
        </div>
      </form>
    </div>
  );
}
