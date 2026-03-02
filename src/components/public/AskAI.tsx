"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, ExternalLink, X } from "lucide-react";

type Source = { title: string; url: string; type: string };

type Result = {
  answer: string;
  sources: Source[];
  configured: boolean;
};

export function AskAI() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || isPending) return;

    setResult(null);
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/ai/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: question.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Ошибка запроса");
          return;
        }
        setResult(data);
      } catch {
        setError("Ошибка сети. Проверьте подключение.");
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    setError("");
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Панель */}
      {open && (
        <div className="w-[360px] sm:w-[400px] bg-[#050E1C] border border-white/10 shadow-2xl shadow-black/60">
          {/* Шапка */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#00E5C0]" />
              <span className="text-sm font-black text-white uppercase tracking-wider">
                ИИ-помощник АНИЦ
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-white/30 hover:text-white transition-colors"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Форма */}
          <div className="p-5 space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Задайте вопрос об АНИЦ..."
                className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#00E5C0]/50 transition-all"
                disabled={isPending}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={isPending || !question.trim()}
                className="bg-[#00E5C0] text-[#050E1C] px-4 py-2.5 hover:bg-[#00E5C0]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
                aria-label="Отправить"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>

            {/* Ошибка */}
            {error && (
              <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                <span>{error}</span>
              </div>
            )}

            {/* Результат */}
            {result && (
              <div className="space-y-4">
                <div className="bg-white/5 p-4 border border-white/5">
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {result.answer}
                  </p>
                </div>

                {result.sources.length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-black mb-2">
                      Источники
                    </p>
                    <ul className="space-y-1.5">
                      {result.sources.map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            className="flex items-center gap-1.5 text-sm text-[#00E5C0]/70 hover:text-[#00E5C0] transition-colors"
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <span className="line-clamp-1">{s.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { setResult(null); setQuestion(""); inputRef.current?.focus(); }}
                  className="text-xs text-white/25 hover:text-white/50 underline underline-offset-2 transition-colors"
                >
                  Задать другой вопрос
                </button>
              </div>
            )}

            {/* Hint */}
            {!result && !error && (
              <p className="text-[10px] text-white/20 text-center uppercase tracking-wider">
                Отвечает на основе материалов сайта
              </p>
            )}
          </div>
        </div>
      )}

      {/* Кнопка-триггер */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-[#00E5C0] text-[#050E1C] px-5 py-3 font-black text-sm uppercase tracking-wider hover:bg-[#00E5C0]/90 transition-colors shadow-lg shadow-[#00E5C0]/20"
      >
        <Sparkles className="h-4 w-4" />
        {open ? "Закрыть" : "Спросить ИИ"}
      </button>
    </div>
  );
}
