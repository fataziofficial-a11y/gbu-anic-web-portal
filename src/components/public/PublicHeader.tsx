"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Snowflake } from "lucide-react";

const NAV = [
  { label: "Главная", href: "/" },
  { label: "О Центре", href: "/about" },
  { label: "Исследования", href: "/research" },
  { label: "Новости", href: "/news" },
  { label: "Медиа", href: "/media" },
  { label: "Образование", href: "/education" },
  { label: "Партнёрам", href: "/partners" },
  { label: "Документы", href: "/documents" },
  { label: "Закупки", href: "/procurement" },
  { label: "Контакты", href: "/contacts" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050E1C] border-b border-[#00E5C0]/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-4">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0 mr-2">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <div className="absolute inset-0 border border-[#00E5C0]/30 rotate-45 group-hover:border-[#00E5C0]/70 transition-colors" />
              <Snowflake className="relative h-3.5 w-3.5 text-[#00E5C0]" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[11px] font-black text-white tracking-[0.18em] uppercase leading-none">ГБУ АНИЦ</p>
              <p className="text-[9px] text-[#00E5C0]/50 tracking-[0.15em] uppercase leading-none mt-0.5">Арктический НИЦ РС(Я)</p>
            </div>
          </Link>
          <div className="hidden md:block h-5 w-px bg-[#00E5C0]/15 flex-shrink-0" />
          <nav className="hidden md:flex items-center gap-0 flex-1 min-w-0">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-2 py-2 text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors duration-200 whitespace-nowrap ${
                  isActive(item.href) ? "text-[#00E5C0]" : "text-white/40 hover:text-white"
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-[#00E5C0]" />
                )}
              </Link>
            ))}
          </nav>
          <button
            className="md:hidden ml-auto p-2 text-white/40 hover:text-[#00E5C0] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-[#050E1C] border-t border-[#00E5C0]/10 px-4 py-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block py-2.5 border-b border-white/5 last:border-0 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                isActive(item.href) ? "text-[#00E5C0]" : "text-white/40 hover:text-white"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
