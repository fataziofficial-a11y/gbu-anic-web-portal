import type { Metadata } from "next";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import { PageBanner } from "@/components/public/PageBanner";
import { ContactForm } from "@/components/public/ContactForm";
import { getPublicSettings } from "@/lib/public-settings";

export const metadata: Metadata = { title: "Контакты" };

export default async function ContactsPage() {
  const s = await getPublicSettings();

  return (
    <div>
      <PageBanner
        eyebrow="Связь"
        title="Контакты"
        description="Как с нами связаться"
      />

      <div className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Реквизиты</p>
              <h2 className="mt-2 text-3xl font-black text-[#0D1C2E]">Наш адрес</h2>
            </div>

            {[
              { icon: MapPin, title: "Адрес", content: s.contact_address, href: undefined },
              { icon: Mail, title: "Электронная почта", content: s.contact_email, href: `mailto:${s.contact_email}` },
              { icon: Phone, title: "Телефон", content: s.contact_phone, href: `tel:${s.contact_phone.replace(/[^+\d]/g, "")}` },
              { icon: Clock, title: "Режим работы", content: "Пн–Пт: 9:00 — 18:00", href: undefined },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-[#DDE8F0] bg-white p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#5CAFD6]">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8B9BAD]">{item.title}</p>
                  {item.href ? (
                    <a href={item.href} className="mt-0.5 font-semibold text-[#0D1C2E] transition hover:text-[#1A3A6B]">
                      {item.content}
                    </a>
                  ) : (
                    <p className="mt-0.5 font-semibold text-[#0D1C2E]">{item.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Обращение</p>
              <h2 className="mt-2 text-3xl font-black text-[#0D1C2E]">Написать нам</h2>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
