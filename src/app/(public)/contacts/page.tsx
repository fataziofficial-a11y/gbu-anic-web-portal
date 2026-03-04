import type { Metadata } from "next";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import { ContactForm } from "@/components/public/ContactForm";
import { getPublicSettings } from "@/lib/public-settings";

export const metadata: Metadata = { title: "Контакты" };

export default async function ContactsPage() {
  const s = await getPublicSettings();

  return (
    <div>
      <section className="arctic-page-header text-white py-20 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#00E5C0]/50 text-xs font-bold tracking-[0.2em] uppercase mb-3">Связь</p>
          <h1 className="heading-display text-4xl lg:text-5xl text-white mb-3">Контакты</h1>
          <p className="text-white/40 text-lg">Как с нами связаться</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div>
              <p className="text-[#00E5C0] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Реквизиты</p>
              <h2 className="heading-display text-3xl text-white mb-6">Наш адрес</h2>
            </div>

            <div className="space-y-2">
              {[
                {
                  icon: MapPin,
                  title: "Адрес",
                  content: s.contact_address,
                },
                {
                  icon: Mail,
                  title: "Электронная почта",
                  content: s.contact_email,
                  href: `mailto:${s.contact_email}`,
                },
                {
                  icon: Phone,
                  title: "Телефон",
                  content: s.contact_phone,
                  href: `tel:${s.contact_phone.replace(/[^+\d]/g, "")}`,
                },
                {
                  icon: Clock,
                  title: "Режим работы",
                  content: "Пн–Пт: 9:00 — 18:00",
                },
              ].map((item) => (
                <div key={item.title} className="card-dark p-5 flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/5 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-[#00E5C0]/50" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-0.5">{item.title}</p>
                    {item.href ? (
                      <a href={item.href} className="font-bold text-white hover:text-[#00E5C0] transition-colors">
                        {item.content}
                      </a>
                    ) : (
                      <p className="font-bold text-white">{item.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6">
              <p className="text-[#00E5C0] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Обращение</p>
              <h2 className="heading-display text-3xl text-white">Написать нам</h2>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
