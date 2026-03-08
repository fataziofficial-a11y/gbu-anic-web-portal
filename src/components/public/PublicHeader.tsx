"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { label: "О центре", href: "/about" },
  { label: "Исследования", href: "/research" },
  { label: "Новости", href: "/news" },
  { label: "Медиа", href: "/media" },
  { label: "Партнёрам", href: "/partners" },
  { label: "Документы", href: "/documents" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <a href="#main-content" className="skip-link">Перейти к содержимому</a>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#060E18] border-b border-white/8">
        {/* Top accent line */}
        <div className="h-[3px] bg-[#5CAFD6]" />

        <div className="mx-auto flex h-[64px] max-w-[1240px] items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center bg-[#5CAFD6] text-[#060E18] font-black text-[13px] select-none">
              А
            </div>
            <div>
              <p className="text-[15px] font-black uppercase tracking-[0.12em] text-white leading-none">
                АНИЦ
              </p>
              <p className="text-[10px] text-white/35 hidden sm:block mt-0.5">
                ГБУ Республики Саха (Якутия)
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 xl:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] font-medium transition-colors duration-150 ${
                  pathname.startsWith(item.href)
                    ? "text-[#5CAFD6] font-semibold"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/contacts"
              className="hidden xl:inline-flex items-center bg-[#5CAFD6] text-[#060E18] px-5 py-2 text-[12px] font-black uppercase tracking-[0.1em] transition-colors hover:bg-[#7CC4E8]"
            >
              Связаться с нами
            </Link>
            <button
              type="button"
              className="p-2 xl:hidden text-white/70 hover:text-white transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-white/8 bg-[#060E18] px-4 py-4 xl:hidden">
            <div className="flex flex-col gap-0.5">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href)
                      ? "text-[#5CAFD6] bg-white/5"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/contacts"
                onClick={() => setMobileOpen(false)}
                className="mt-3 bg-[#5CAFD6] text-[#060E18] px-4 py-3 text-sm font-black uppercase tracking-[0.1em] text-center"
              >
                Связаться с нами
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
