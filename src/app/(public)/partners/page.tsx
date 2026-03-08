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
      <section className="bg-[#060E18] border-b-[3px] border-[#5CAFD6] py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-[2px] w-6 bg-[#5CAFD6]" />
            <span className="text-[#5CAFD6] text-[11px] font-black uppercase tracking-[0.22em]">Сотрудничество</span>
          </div>
          <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-black text-white leading-[1.05]">Партнёрам</h1>
          <p className="mt-4 text-base text-white/50">
            Организации, с которыми сотрудничает АНИЦ, и возможности для партнёрства
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] space-y-16 px-4 py-14 sm:px-6">
        {items.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Партнёры</p>
            <h2 className="mt-2 text-3xl font-black text-[#0D1C2E]">Наши партнёры</h2>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-[#DDE8F0] bg-white p-6">
                  {item.logo ? (
                    <div className="flex h-14 w-full items-center">
                      <Image
                        src={item.logo.url}
                        alt={item.name}
                        width={160}
                        height={56}
                        className="max-h-14 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B]">
                      <Handshake className="h-5 w-5" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-bold text-[#0D1C2E]">{item.name}</h3>
                    {item.description && (
                      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-[#4B6075]">{item.description}</p>
                    )}
                    {item.services && (
                      <p className="mt-2 line-clamp-2 text-xs text-[#8B9BAD]">{item.services}</p>
                    )}
                  </div>

                  {item.websiteUrl && (
                    <a
                      href={item.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-[#1A3A6B] transition hover:text-[#5CAFD6]"
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
        <section className="rounded-3xl bg-[#F7FAFD] p-8 lg:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Возможности</p>
          <h2 className="mt-2 text-3xl font-black text-[#0D1C2E]">Услуги и возможности АНИЦ</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#4B6075]">
            Арктический научно-исследовательский центр РС(Я) предлагает широкий спектр услуг
            для государственных организаций, коммерческих структур и научных учреждений.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { title: "Историко-культурная экспертиза", desc: "Проведение экспертизы земельных участков и объектов культурного наследия" },
              { title: "Полевые исследования", desc: "Организация археологических, этнографических и природных экспедиций" },
              { title: "Научные консультации", desc: "Экспертная поддержка проектов в области арктических исследований" },
              { title: "Совместные проекты", desc: "Участие в грантовых программах и исследовательских консорциумах" },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-[#DDE8F0] bg-white p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF4FB] text-[#1A3A6B]">
                  <FlaskConical className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-[#0D1C2E]">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#4B6075]">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/contacts"
              className="inline-flex items-center gap-2 rounded-full bg-[#1A3A6B] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0D2743]"
            >
              Связаться с нами
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
