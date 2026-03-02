"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, ExternalLink, X, MessageCircle } from "lucide-react";

type Source = { title: string; url: string };

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

let nextId = 0;

export function AskAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { id: ++nextId, role: "user", content: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: ++nextId,
          role: "assistant",
          content: res.ok ? data.answer : (data.error ?? "Ошибка запроса"),
          sources: res.ok ? data.sources ?? [] : [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: ++nextId, role: "assistant", content: "Ошибка сети. Проверьте подключение." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Чат-панель ─────────────────────────────────────────────── */}
      {open && (
        <div className="w-screen h-[100dvh] sm:w-[380px] sm:h-[480px] flex flex-col bg-[#050E1C] sm:border sm:border-white/10 shadow-2xl shadow-black/70">

          {/* Шапка */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#00E5C0]/10 border border-[#00E5C0]/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[#00E5C0]" />
              </div>
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-wider leading-none">
                  ИИ-помощник АНИЦ
                </p>
                <p className="text-[10px] text-[#00E5C0]/50 mt-0.5">
                  На основе материалов сайта
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/25 hover:text-white transition-colors"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-6">
                <div className="w-12 h-12 bg-[#00E5C0]/10 border border-[#00E5C0]/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[#00E5C0]/60" />
                </div>
                <div>
                  <p className="text-white/50 text-sm font-bold">Задайте вопрос об АНИЦ</p>
                  <p className="text-white/20 text-xs mt-1 leading-relaxed max-w-[210px] mx-auto">
                    Отвечу на основе новостей и базы знаний
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
              >
                {/* Аватар ИИ */}
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 bg-[#00E5C0]/10 border border-[#00E5C0]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-3 w-3 text-[#00E5C0]" />
                  </div>
                )}

                <div className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"} max-w-[78%]`}>
                  {/* Пузырь */}
                  <div
                    className={
                      msg.role === "user"
                        ? "bg-[#00E5C0] text-[#050E1C] text-sm px-3.5 py-2.5 font-medium leading-relaxed"
                        : "bg-white/[0.06] border border-white/[0.08] text-white/80 text-sm px-3.5 py-2.5 leading-relaxed"
                    }
                  >
                    {msg.content}
                  </div>

                  {/* Источники */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="space-y-0.5 px-0.5">
                      {msg.sources.map((s) => (
                        <a
                          key={s.url}
                          href={s.url}
                          className="flex items-center gap-1 text-[11px] text-[#00E5C0]/40 hover:text-[#00E5C0] transition-colors"
                        >
                          <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="line-clamp-1">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Индикатор печати */}
            {loading && (
              <div className="flex justify-start gap-2">
                <div className="w-6 h-6 bg-[#00E5C0]/10 border border-[#00E5C0]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-3 w-3 text-[#00E5C0]" />
                </div>
                <div className="bg-white/[0.06] border border-white/[0.08] px-4 py-3.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#00E5C0]/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-[#00E5C0]/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-[#00E5C0]/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Поле ввода */}
          <div className="border-t border-white/10 p-3 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напишите сообщение..."
                disabled={loading}
                maxLength={500}
                className="flex-1 bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#00E5C0]/50 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-[#00E5C0] text-[#050E1C] px-3.5 py-2.5 hover:bg-[#00E5C0]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
                aria-label="Отправить"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Кнопка-триггер ─────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-14 h-14 bg-[#00E5C0] text-[#050E1C] items-center justify-center shadow-lg shadow-[#00E5C0]/20 hover:bg-[#00E5C0]/90 transition-colors m-4 sm:m-0 ${open ? "hidden sm:flex" : "flex"}`}
        aria-label={open ? "Закрыть чат" : "Открыть ИИ-помощник"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
