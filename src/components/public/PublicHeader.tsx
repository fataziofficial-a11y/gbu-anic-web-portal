"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

const NAV = [
  { label: "О центре", href: "/about" },
  { label: "Исследования и проекты", href: "/research" },
  { label: "Новости", href: "/news" },
  { label: "Медиа", href: "/media" },
  { label: "Партнёрам", href: "/partners" },
  { label: "Документы", href: "/documents" },
  { label: "Закупки", href: "/procurement" },
];

/** Рубрика новостей — приходит с сервера, ведёт на отфильтрованную ленту. */
export type NewsRubric = { name: string; slug: string };

export function PublicHeader({ rubrics = [] }: { rubrics?: NewsRubric[] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Список рубрик под «Новостями». Открывается по наведению на широких
  // экранах и по нажатию — на устройствах без мыши.
  const [rubricsOpen, setRubricsOpen] = useState(false);

  return (
    <>
      <a href="#main-content" className="skip-link">Перейти к содержимому</a>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#060E18] border-b border-white/8">
        {/* Top accent line */}
        <div className="h-[3px] bg-[#5CAFD6]" />

        <div className="mx-auto flex h-[64px] max-w-[1240px] items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/logo-anic.png"
              alt="АНИЦ"
              width={44}
              height={44}
              className="rounded-full"
              priority
            />
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
            {NAV.map((item) =>
              item.href === "/news" && rubrics.length > 0 ? (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setRubricsOpen(true)}
                  onMouseLeave={() => setRubricsOpen(false)}
                >
                  <div className="flex items-center gap-1">
                    <Link
                      href={item.href}
                      className={`text-[13px] font-medium transition-colors duration-150 ${
                        pathname.startsWith(item.href)
                          ? "text-[#5CAFD6] font-semibold"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setRubricsOpen((v) => !v)}
                      aria-expanded={rubricsOpen}
                      aria-label="Рубрики новостей"
                      className="text-white/40 transition-colors hover:text-white"
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${rubricsOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>
                  {rubricsOpen && (
                    <div className="absolute left-0 top-full min-w-[200px] border border-white/10 bg-[#0D2743] py-1 shadow-xl">
                      {rubrics.map((r) => (
                        <Link
                          key={r.slug}
                          href={`/news?category=${encodeURIComponent(r.name)}`}
                          onClick={() => setRubricsOpen(false)}
                          className="block px-4 py-2.5 text-[13px] text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          {r.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
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
              )
            )}
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/contacts"
              className="hidden xl:inline-flex items-center bg-[#5CAFD6] text-[#060E18] px-5 py-2 text-[13px] font-bold transition-colors hover:bg-[#7CC4E8]"
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
              {rubrics.length > 0 && (
                <div className="mt-1 border-l border-white/10 pl-3">
                  {rubrics.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/news?category=${encodeURIComponent(r.name)}`}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {r.name}
                    </Link>
                  ))}
                </div>
              )}
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
