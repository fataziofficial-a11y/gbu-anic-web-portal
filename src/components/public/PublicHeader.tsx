"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

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
    <header className="sticky top-0 z-50 border-b border-[#dbdbdb] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[70px] max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00C9A7] text-white font-black">A</div>
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#111111]">ГБУ АНИЦ</p>
            <p className="text-[10px] text-[#777777]">Арктический научно-исследовательский центр</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[14px] font-medium transition-colors ${
                isActive(item.href) ? "text-[#00a98b]" : "text-[#333333] hover:text-[#00a98b]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="p-2 text-[#333333] lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#e2e2e2] bg-white px-4 py-3 lg:hidden">
          <div className="grid gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive(item.href) ? "bg-[#00C9A7]/12 text-[#008f75]" : "text-[#333333] hover:bg-[#f4f4f4]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

