"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, ExternalLink, X, ChevronDown } from "lucide-react";

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
    if (open) inputRef.current?.focus();
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

  return (
    <div className="relative">
      {/* Кнопка-триггер */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-glacial text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-glacial-dark transition-colors shadow-sm shadow-glacial/20"
        >
          <Sparkles className="h-4 w-4" />
          Спросить ИИ
        </button>
      )}

      {/* Панель */}
      {open && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg w-full max-w-xl">
          {/* Шапка */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-glacial/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-glacial" />
              </div>
              <span className="text-sm font-semibold text-arctic-900">ИИ-помощник АНИЦ</span>
            </div>
            <button
              onClick={() => { setOpen(false); setResult(null); setError(""); }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Задайте вопрос об АНИЦ..."
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-glacial/30 focus:border-glacial transition-all bg-frost-50/50"
                disabled={isPending}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={isPending || !question.trim()}
                className="bg-glacial text-white px-4 py-2.5 rounded-xl hover:bg-glacial-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-semibold"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Ошибка */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            {/* Результат */}
            {result && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-arctic-900 leading-relaxed whitespace-pre-wrap">
                    {result.answer}
                  </p>
                </div>

                {result.sources.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                      Источники
                    </p>
                    <ul className="space-y-1.5">
                      {result.sources.map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            className="flex items-center gap-1.5 text-sm text-glacial hover:text-glacial-dark transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                            {s.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { setResult(null); setQuestion(""); inputRef.current?.focus(); }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
                >
                  Задать другой вопрос
                </button>
              </div>
            )}

            {/* Disclaimer */}
            {!result && !error && (
              <p className="text-[10px] text-slate-400 text-center">
                ИИ отвечает на основе материалов сайта. Может ошибаться.
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
