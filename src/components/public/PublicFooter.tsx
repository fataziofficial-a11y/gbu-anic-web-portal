import Link from "next/link";
import { Snowflake, Mail, MapPin, ExternalLink, ArrowRight } from "lucide-react";

export function PublicFooter() {
  const year = new Date().getFullYear();

  const navLinks = [
    { label: "Новости", href: "/news" },
    { label: "Медиа", href: "/media" },
    { label: "Образование", href: "/education" },
    { label: "Партнёрам", href: "/partners" },
    { label: "Документы", href: "/documents" },
    { label: "Закупки", href: "/procurement" },
    { label: "База знаний", href: "/knowledge-base" },
    { label: "Контакты", href: "/contacts" },
  ];

  return (
    <footer className="bg-[#030C18] border-t border-[#00E5C0]/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

          {/* Brand */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <div className="absolute inset-0 border border-[#00E5C0]/30 rotate-45" />
                <Snowflake className="relative h-4 w-4 text-[#00E5C0]" />
              </div>
              <div>
                <p className="text-sm font-black text-white tracking-[0.15em] uppercase">ГБУ АНИЦ</p>
                <p className="text-[9px] text-[#00E5C0]/40 tracking-[0.15em] uppercase mt-0.5">Арктический НИЦ РС(Я)</p>
              </div>
            </div>
            <p className="text-sm text-white/30 leading-relaxed max-w-xs">
              Государственное бюджетное учреждение Арктический научно-исследовательский центр
              Республики Саха (Якутия)
            </p>
            <div className="flex items-center gap-2 mt-6">
              <span className="h-px w-8 bg-[#00E5C0]/20" />
              <span className="text-[9px] text-white/20 uppercase tracking-widest">Наука для Арктики</span>
            </div>
          </div>

          {/* Nav */}
          <div className="md:col-span-4">
            <p className="text-[9px] font-bold text-[#00E5C0]/60 uppercase tracking-[0.3em] mb-5">Разделы</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-white/30 hover:text-[#00E5C0] transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-[#00E5C0] transition-all duration-200 flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <p className="text-[9px] font-bold text-[#00E5C0]/60 uppercase tracking-[0.3em] mb-5">Контакты</p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#00E5C0]/30 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-white/30 leading-relaxed">
                  г. Якутск, Республика Саха (Якутия)
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#00E5C0]/30 flex-shrink-0" />
                <a href="mailto:info@anic.ru" className="text-xs text-white/30 hover:text-[#00E5C0] transition-colors">
                  info@anic.ru
                </a>
              </li>
            </ul>
            <Link
              href="/contacts"
              className="inline-flex items-center gap-2 border border-[#00E5C0]/20 text-[#00E5C0] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-[#00E5C0]/5 transition-colors"
            >
              Написать нам
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-white/15 tracking-wider">&copy; {year} ГБУ АНИЦ. Все права защищены.</p>
          <Link href="/admin" className="text-[10px] text-white/15 hover:text-[#00E5C0]/50 transition-colors tracking-wider uppercase">
            Панель управления
          </Link>
        </div>
      </div>
    </footer>
  );
}
