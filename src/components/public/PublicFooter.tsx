import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getPublicSettings } from "@/lib/public-settings";

export async function PublicFooter() {
  const year = new Date().getFullYear();
  const s = await getPublicSettings();

  return (
    <footer className="mt-16 border-t border-[#d2dee9] bg-[#f8fbfe]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a6aa7] text-white font-black">A</div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.15em] text-[#0d2743]">{s.site_name}</p>
              <p className="text-xs text-[#53677a]">{s.site_description}</p>
            </div>
          </div>
          <p className="max-w-lg text-sm leading-relaxed text-[#4b6075]">
            Государственное бюджетное учреждение Республики Саха (Якутия),
            выполняющее комплексные научные исследования Арктики.
          </p>
        </div>

        <div className="lg:col-span-3">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#0d2743]">Разделы</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Link href="/news" className="text-[#4b6075] hover:text-[#2a6aa7]">Новости</Link>
            <Link href="/research" className="text-[#4b6075] hover:text-[#2a6aa7]">Исследования</Link>
            <Link href="/media" className="text-[#4b6075] hover:text-[#2a6aa7]">Медиа</Link>
            <Link href="/education" className="text-[#4b6075] hover:text-[#2a6aa7]">Образование</Link>
            <Link href="/partners" className="text-[#4b6075] hover:text-[#2a6aa7]">Партнёрам</Link>
            <Link href="/documents" className="text-[#4b6075] hover:text-[#2a6aa7]">Документы</Link>
            <Link href="/procurement" className="text-[#4b6075] hover:text-[#2a6aa7]">Закупки</Link>
            <Link href="/contacts" className="text-[#4b6075] hover:text-[#2a6aa7]">Контакты</Link>
          </div>
        </div>

        <div className="lg:col-span-4">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#0d2743]">Контакты</p>
          <div className="space-y-3 text-sm text-[#4b6075]">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-[#2a6aa7]" />
              <span>{s.contact_address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#2a6aa7]" />
              <a href={`mailto:${s.contact_email}`} className="hover:text-[#2a6aa7]">{s.contact_email}</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#2a6aa7]" />
              <a href={`tel:${s.contact_phone.replace(/[^+\d]/g, "")}`} className="hover:text-[#2a6aa7]">
                {s.contact_phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#d2dee9] bg-[#eef4f9]">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-[#53677a] sm:flex-row sm:px-6 lg:px-8">
          <span>© {year} {s.site_name}. Все права защищены.</span>
          <Link href="/admin" className="hover:text-[#2a6aa7]">Панель управления</Link>
        </div>
      </div>
    </footer>
  );
}
