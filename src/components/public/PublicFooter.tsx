import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[#d9d9d9] bg-white">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00C9A7] text-white font-black">A</div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.15em] text-[#111111]">ГБУ АНИЦ</p>
              <p className="text-xs text-[#777777]">Арктический научно-исследовательский центр</p>
            </div>
          </div>
          <p className="max-w-lg text-sm leading-relaxed text-[#666666]">
            Государственное бюджетное учреждение Республики Саха (Якутия),
            выполняющее комплексные научные исследования Арктики.
          </p>
        </div>

        <div className="lg:col-span-3">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#111111]">Разделы</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Link href="/news" className="text-[#555555] hover:text-[#00a98b]">Новости</Link>
            <Link href="/research" className="text-[#555555] hover:text-[#00a98b]">Исследования</Link>
            <Link href="/media" className="text-[#555555] hover:text-[#00a98b]">Медиа</Link>
            <Link href="/education" className="text-[#555555] hover:text-[#00a98b]">Образование</Link>
            <Link href="/partners" className="text-[#555555] hover:text-[#00a98b]">Партнёрам</Link>
            <Link href="/documents" className="text-[#555555] hover:text-[#00a98b]">Документы</Link>
            <Link href="/procurement" className="text-[#555555] hover:text-[#00a98b]">Закупки</Link>
            <Link href="/contacts" className="text-[#555555] hover:text-[#00a98b]">Контакты</Link>
          </div>
        </div>

        <div className="lg:col-span-4">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#111111]">Контакты</p>
          <div className="space-y-3 text-sm text-[#555555]">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-[#00a98b]" />
              <span>г. Якутск, Республика Саха (Якутия)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#00a98b]" />
              <a href="mailto:info@anic.ru" className="hover:text-[#00a98b]">info@anic.ru</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#00a98b]" />
              <span>+7 (4112) XX-XX-XX</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#e3e3e3] bg-[#f8f8f8]">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-[#777777] sm:flex-row sm:px-6 lg:px-8">
          <span>© {year} ГБУ АНИЦ. Все права защищены.</span>
          <Link href="/admin" className="hover:text-[#00a98b]">Панель управления</Link>
        </div>
      </div>
    </footer>
  );
}

