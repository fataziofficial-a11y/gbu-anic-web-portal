"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

/**
 * Поле поиска в шапке сайта.
 *
 * Ведёт на /search — искать по всему сайту с одной страницы удобнее, чем
 * подсказками в выпадающем списке: у материалов длинные заголовки, и в узкий
 * список они не помещаются.
 */
export function SearchBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (query.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={submit} role="search" className={compact ? "w-full" : "w-[200px]"}>
      <label htmlFor={compact ? "site-search-mobile" : "site-search"} className="sr-only">
        Поиск по сайту
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
          aria-hidden="true"
        />
        <input
          id={compact ? "site-search-mobile" : "site-search"}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по сайту"
          className="w-full border border-white/15 bg-white/5 py-2 pl-9 pr-3 text-[13px] text-white
                     placeholder:text-white/35 focus:border-[#5CAFD6] focus:outline-none"
        />
      </div>
    </form>
  );
}
