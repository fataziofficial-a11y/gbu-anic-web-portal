"use client";

import { searchHref, SEARCH_TYPE_LABEL } from "@/lib/search/labels";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";

/**
 * Поиск по сайту — плавающий виджет в углу страницы.
 *
 * Занимает место прежнего ИИ-помощника: посетители уже привыкли, что помощь
 * ищется в правом нижнем углу. Запрос уходит в /api/search, который сам
 * выбирает поисковый движок, а при его недоступности ищет по базе.
 *
 * Ищем по мере ввода с задержкой в 350 мс: без задержки каждая буква
 * порождала бы запрос, с задержкой большая часть промежуточных слов
 * до сервера просто не доходит.
 */
type Result = {
  type: string;
  id: number;
  title: string;
  slug?: string;
  url?: string;
  excerpt?: string | null;
};

const TYPE_LABEL = SEARCH_TYPE_LABEL;

function hrefFor(r: Result): string {
  return searchHref(r);
}

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    // Прерываем предыдущий запрос: ответы приходят не в том порядке,
    // в каком уходили, и без отмены на экран может попасть старый.
    const ac = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ac.signal });
        const data = await res.json();
        setResults(res.ok ? (data.data?.results ?? []) : []);
        setSearched(true);
      } catch {
        /* отменённый запрос — не ошибка */
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [q]);

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[100dvh] w-screen flex-col bg-[#0D2743] shadow-2xl shadow-[#0D2743]/70 sm:h-[480px] sm:w-[380px] sm:border sm:border-[#5CAFD6]/30">
          {/* Шапка */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center border border-[#5CAFD6]/35 bg-[#5CAFD6]/15">
                <Search className="h-4 w-4 text-[#A9D2EA]" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase leading-none tracking-wider text-white">
                  Поиск по сайту
                </p>
                <p className="mt-0.5 text-[10px] text-[#A9D2EA]/70">
                  Новости, страницы, база знаний
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/25 transition-colors hover:text-white"
              aria-label="Закрыть поиск"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Поле ввода */}
          <div className="flex-shrink-0 border-b border-white/10 p-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Например: конкурс научный сотрудник"
                maxLength={200}
                className="w-full border border-white/10 bg-white/5 py-2.5 pl-9 pr-9 text-sm text-white placeholder-white/25 transition-all focus:border-[#A9D2EA]/60 focus:outline-none"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#A9D2EA]/70" />
              )}
            </div>
          </div>

          {/* Результаты */}
          <div className="flex-1 space-y-1 overflow-y-auto p-3">
            {q.trim().length < 2 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 pb-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center border border-[#5CAFD6]/35 bg-[#5CAFD6]/15">
                  <Search className="h-5 w-5 text-[#A9D2EA]/80" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/50">Что вы ищете?</p>
                  <p className="mx-auto mt-1 max-w-[210px] text-xs leading-relaxed text-white/20">
                    Ищем по новостям, страницам и базе знаний. Опечатки и падежи
                    не помеха.
                  </p>
                </div>
              </div>
            )}

            {searched && !loading && results.length === 0 && q.trim().length >= 2 && (
              <p className="px-1 py-4 text-center text-sm text-white/40">
                Ничего не найдено
              </p>
            )}

            {results.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                href={hrefFor(r)}
                onClick={() => setOpen(false)}
                className="block border border-transparent px-3 py-2.5 transition-colors hover:border-white/10 hover:bg-white/[0.06]"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A9D2EA]/70">
                  {TYPE_LABEL[r.type] ?? r.type}
                </span>
                <p className="mt-0.5 text-sm font-medium leading-snug text-white/90">{r.title}</p>
              </Link>
            ))}

            {results.length > 0 && (
              <Link
                href={`/search?q=${encodeURIComponent(q.trim())}`}
                onClick={() => setOpen(false)}
                className="block px-3 py-3 text-center text-[12px] text-[#A9D2EA]/80 transition-colors hover:text-[#A9D2EA]"
              >
                Показать все результаты на отдельной странице
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Кнопка-триггер */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`m-4 h-14 w-14 items-center justify-center bg-[#A9D2EA] text-[#0D2743] shadow-lg shadow-[#0D2743]/20 transition-colors hover:bg-[#A9D2EA]/90 sm:m-0 ${
          open ? "hidden sm:flex" : "flex"
        }`}
        aria-label={open ? "Закрыть поиск" : "Открыть поиск по сайту"}
      >
        {open ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
      </button>
    </div>
  );
}
