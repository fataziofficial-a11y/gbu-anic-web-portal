import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { Globe, ArrowRight, Handshake, FlaskConical } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Партнёрам" };
export const revalidate = 3600;

export default async function PartnersPage() {
  const items = await db.query.partners.findMany({
    orderBy: [asc(partners.sortOrder), asc(partners.name)],
    with: { logo: true },
  });

  return (
    <div>
      <section className="arctic-page-header text-white py-16 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#00E5C0]/50 text-xs font-bold tracking-[0.2em] uppercase mb-3">
            Сотрудничество
          </p>
          <h1 className="heading-display text-4xl lg:text-5xl text-white mb-3">Партнёрам</h1>
          <p className="text-white/40 text-lg max-w-xl">
            Организации, с которыми сотрудничает АНИЦ, и возможности для партнёрства
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">

        {/* Partners grid */}
        {items.length > 0 && (
          <section>
            <p className="text-[#00E5C0] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Партнёры</p>
            <h2 className="heading-display text-3xl lg:text-4xl text-white mb-8">Наши партнёры</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item) => (
                <div key={item.id} className="card-dark p-6 flex flex-col gap-4">
                  {/* Logo */}
                  {item.logo ? (
                    <div className="relative h-14 w-full flex items-center">
                      <Image
                        src={item.logo.url}
                        alt={item.name}
                        width={160}
                        height={56}
                        className="object-contain max-h-14"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 bg-white/5 flex items-center justify-center">
                      <Handshake className="h-5 w-5 text-[#00E5C0]/50" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-white/35 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    )}
                    {item.services && (
                      <p className="text-xs text-white/20 mt-2 line-clamp-2">{item.services}</p>
                    )}
                  </div>

                  {item.websiteUrl && (
                    <a
                      href={item.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#00E5C0]/70 hover:text-[#00E5C0] transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      Сайт организации
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cooperation info */}
        <section className="border border-[#00E5C0]/20 p-8 lg:p-12">
          <div className="max-w-3xl">
            <p className="text-[#00E5C0] text-[10px] font-black uppercase tracking-[0.3em] mb-2">
              Возможности
            </p>
            <h2 className="heading-display text-3xl text-white mb-6">
              Услуги и возможности АНИЦ
            </h2>
            <div className="space-y-4 text-white/35 text-sm leading-relaxed">
              <p>
                Арктический научно-исследовательский центр РС(Я) предлагает широкий спектр услуг
                для государственных организаций, коммерческих структур и научных учреждений.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                {[
                  {
                    title: "Историко-культурная экспертиза",
                    desc: "Проведение экспертизы земельных участков и объектов культурного наследия",
                  },
                  {
                    title: "Полевые исследования",
                    desc: "Организация археологических, этнографических и природных экспедиций",
                  },
                  {
                    title: "Научные консультации",
                    desc: "Экспертная поддержка проектов в области арктических исследований",
                  },
                  {
                    title: "Совместные проекты",
                    desc: "Участие в грантовых программах и исследовательских консорциумах",
                  },
                ].map((s) => (
                  <div key={s.title} className="card-dark p-5">
                    <FlaskConical className="h-4 w-4 text-[#00E5C0]/50 mb-3" />
                    <h3 className="font-black text-white text-sm uppercase tracking-tight mb-1">{s.title}</h3>
                    <p className="text-white/30 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <Link
                href="/contacts"
                className="inline-flex items-center gap-2 bg-[#00E5C0] text-[#050E1C] px-6 py-3 font-black text-sm uppercase tracking-wider hover:bg-[#00E5C0]/90 transition-colors"
              >
                Связаться с нами
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
