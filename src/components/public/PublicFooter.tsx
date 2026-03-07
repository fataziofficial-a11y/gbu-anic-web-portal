import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getPublicSettings } from "@/lib/public-settings";

export async function PublicFooter() {
  const year = new Date().getFullYear();
  const s = await getPublicSettings();

  return (
    <footer className="bg-[#060E18] text-white">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12">
        {/* Brand */}
        <div className="lg:col-span-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A3A6B] text-white font-black text-sm">
              А
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.15em] text-white">{s.site_name}</p>
              <p className="text-xs text-white/40">{s.site_description}</p>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/40">
            Государственное бюджетное учреждение Республики Саха (Якутия),
            выполняющее комплексные научные исследования Арктики.
          </p>
        </div>

        {/* Links */}
        <div className="lg:col-span-3">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white/30">Разделы</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {[
              { label: "Новости", href: "/news" },
              { label: "Исследования", href: "/research" },
              { label: "Медиа", href: "/media" },
              { label: "Партнёрам", href: "/partners" },
              { label: "Документы", href: "/documents" },
              { label: "Контакты", href: "/contacts" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="text-white/50 transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contacts */}
        <div className="lg:col-span-4">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white/30">Контакты</p>
          <div className="space-y-3 text-sm text-white/50">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#5CAFD6]" />
              <span>{s.contact_address}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-[#5CAFD6]" />
              <a href={`mailto:${s.contact_email}`} className="transition hover:text-white">
                {s.contact_email}
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-[#5CAFD6]" />
              <a href={`tel:${s.contact_phone.replace(/[^+\d]/g, "")}`} className="transition hover:text-white">
                {s.contact_phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-white/25 sm:flex-row sm:px-6">
          <span>© {year} {s.site_name}. Все права защищены.</span>
          <Link href="/admin" className="transition hover:text-white/60">
            Панель управления
          </Link>
        </div>
      </div>
    </footer>
  );
}
