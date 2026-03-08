"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onWhite = scrolled || !isHome;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        onWhite ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A3A6B] text-white font-black text-[13px]">
            А
          </div>
          <div>
            <p className={`text-[13px] font-black uppercase tracking-[0.15em] transition-colors duration-300 ${onWhite ? "text-[#0D1C2E]" : "text-white"}`}>
              ГБУ АНИЦ
            </p>
            <p className={`text-[10px] transition-colors duration-300 hidden sm:block ${onWhite ? "text-gray-400" : "text-white/60"}`}>
              Арктический научно-исследовательский центр
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[14px] font-medium transition-colors duration-200 ${
                pathname.startsWith(item.href)
                  ? onWhite ? "text-[#1A3A6B] font-semibold" : "text-[#5CAFD6]"
                  : onWhite ? "text-gray-600 hover:text-[#1A3A6B]" : "text-white/80 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA button */}
        <div className="hidden xl:flex items-center gap-3">
          <Link
            href="/contacts"
            className={`px-5 py-2 text-[13px] font-bold transition-all duration-200 rounded-full ${
              onWhite
                ? "bg-[#1A3A6B] text-white hover:bg-[#0D2743]"
                : "bg-[#5CAFD6] text-[#0D2743] hover:bg-[#7CC4E8]"
            }`}
          >
            Связаться с нами
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className={`p-2 xl:hidden transition-colors ${onWhite ? "text-gray-700" : "text-white"}`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Меню"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 xl:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? "bg-[#1A3A6B]/8 text-[#1A3A6B] font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contacts"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-full bg-[#1A3A6B] px-4 py-2.5 text-sm font-bold text-white text-center"
            >
              Связаться с нами
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
