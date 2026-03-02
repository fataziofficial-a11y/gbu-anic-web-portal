import type { Metadata } from "next";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import { ContactForm } from "@/components/public/ContactForm";

export const metadata: Metadata = { title: "Контакты" };
export const revalidate = 86400;

export default function ContactsPage() {
  return (
    <div>
      <section className="arctic-page-header text-white py-20 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-glacial-light/50 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Связь
          </p>
          <h1 className="heading-serif text-4xl lg:text-5xl text-white mb-3">Контакты</h1>
          <p className="text-slate-300/70 text-lg">Как с нами связаться</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-glacial uppercase tracking-[0.15em] mb-2">
                Реквизиты
              </p>
              <h2 className="heading-serif text-3xl text-arctic-900 mb-6">Наш адрес</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: MapPin,
                  title: "Адрес",
                  content: "677000, Республика Саха (Якутия), г. Якутск, ул. Кирова, д. 1",
                },
                {
                  icon: Mail,
                  title: "Электронная почта",
                  content: "info@anic.ru",
                  href: "mailto:info@anic.ru",
                },
                {
                  icon: Phone,
                  title: "Телефон",
                  content: "+7 (4112) 00-00-00",
                  href: "tel:+74112000000",
                },
                {
                  icon: Clock,
                  title: "Режим работы",
                  content: "Пн–Пт: 9:00 — 18:00",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 bg-white rounded-2xl border border-slate-200/80 p-5 card-hover"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-glacial/8 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-glacial" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                      {item.title}
                    </p>
                    {item.href ? (
                      <a href={item.href} className="font-medium text-glacial-dark hover:text-glacial transition-colors">
                        {item.content}
                      </a>
                    ) : (
                      <p className="font-medium text-arctic-900">{item.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact form */}
          <div>
            <div className="mb-6">
              <p className="text-xs font-semibold text-glacial uppercase tracking-[0.15em] mb-2">
                Обращение
              </p>
              <h2 className="heading-serif text-3xl text-arctic-900">Написать нам</h2>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
