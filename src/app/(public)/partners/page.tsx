import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { Globe, ArrowRight, Handshake } from "lucide-react";
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
          <p className="text-glacial-light/50 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Сотрудничество
          </p>
          <h1 className="heading-serif text-4xl lg:text-5xl text-white mb-3">Партнёрам</h1>
          <p className="text-slate-300/70 text-lg max-w-xl">
            Организации, с которыми сотрудничает АНИЦ, и возможности для партнёрства
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">

        {/* Partners grid */}
        {items.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-arctic-900 mb-8">Наши партнёры</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col gap-4 card-hover"
                >
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
                    <div className="h-14 w-14 rounded-xl bg-glacial/10 flex items-center justify-center">
                      <Handshake className="h-6 w-6 text-glacial" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-semibold text-arctic-900 mb-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    )}
                    {item.services && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">{item.services}</p>
                    )}
                  </div>

                  {item.websiteUrl && (
                    <a
                      href={item.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-glacial hover:text-glacial-dark transition-colors"
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
        <section className="bg-gradient-to-br from-arctic-50 to-frost-50 rounded-3xl p-8 lg:p-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-glacial/10 text-glacial-dark px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
              <Handshake className="h-3.5 w-3.5" />
              Начать сотрудничество
            </div>
            <h2 className="text-3xl font-bold text-arctic-900 mb-4">
              Услуги и возможности АНИЦ
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
              <p>
                Арктический научно-исследовательский центр РС(Я) предлагает широкий спектр услуг
                для государственных организаций, коммерческих структур и научных учреждений.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong>Историко-культурная экспертиза</strong> — проведение историко-культурной
                  экспертизы земельных участков и объектов культурного наследия
                </li>
                <li>
                  <strong>Полевые исследования</strong> — организация и проведение
                  археологических, этнографических и природных экспедиций
                </li>
                <li>
                  <strong>Научные консультации</strong> — экспертная поддержка проектов в
                  области арктических исследований
                </li>
                <li>
                  <strong>Совместные проекты</strong> — участие в грантовых программах и
                  исследовательских консорциумах
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link
                href="/contacts"
                className="inline-flex items-center gap-2 bg-glacial text-white px-6 py-3 rounded-xl font-medium hover:bg-glacial-dark transition-colors"
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
