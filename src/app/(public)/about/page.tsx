import type { Metadata } from "next";
import { Lightbulb, Target, Users, History, Building2, CheckCircle2 } from "lucide-react";
import { PageBanner } from "@/components/public/PageBanner";
import {
  ABOUT_ACTIVITY_DIRECTIONS,
  ABOUT_HISTORY,
  ABOUT_OVERVIEW,
  ABOUT_OVERVIEW_DECREES,
  ABOUT_PRINCIPLES,
  ABOUT_SCIENCE_DIRECTIONS,
  ABOUT_STRUCTURE,
} from "@/lib/content/public-content";

export const metadata: Metadata = { title: "О центре" };
export const revalidate = 3600;

const principleIcons = [Lightbulb, Users, Target] as const;

export default function AboutPage() {
  return (
    <div>
      <PageBanner
        eyebrow="О нас"
        title="О центре"
        description="Арктический научно-исследовательский центр Республики Саха (Якутия) координирует исследования и разработки, направленные на устойчивое развитие Севера и Арктики."
      />

      <div className="mx-auto max-w-[1240px] space-y-20 px-4 py-16 sm:px-6">
        <section className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-[2px] w-6 bg-[#5CAFD6]" />
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#5CAFD6]">Наша миссия</span>
            </div>
            <h2 className="mt-2 text-3xl font-black leading-tight text-[#0D1C2E]">
              Наука на службе устойчивого развития Севера и Арктики
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-[#4B6075]">
              <p>
                Арктический научно-исследовательский центр создан для организации и проведения научных
                исследований, направленных на получение и применение новых знаний о законах развития природы,
                общества и человека, способствующих технологическому, экономическому, культурному развитию
                Республики Саха (Якутия) и Арктической зоны России, укреплению связей между наукой и образованием.
              </p>
              <p>
                Центр объединяет ведущих учёных и исследователей, обеспечивает координацию научных проектов и
                международного сотрудничества в сфере социально-гуманитарных исследований севера и Арктики.
              </p>
              <p className="font-medium text-[#1A3A6B]">
                Миссия центра - развитие Севера и Арктики через научные исследования и разработки.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#DDE8F0] bg-[#F4F8FB] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Наши принципы</p>
            <div className="mt-6 space-y-4">
              {ABOUT_PRINCIPLES.map((item, index) => {
                const Icon = principleIcons[index] ?? CheckCircle2;
                return (
                  <div key={item.title} className="rounded-2xl bg-white p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[#0D1C2E]">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-[#4B6075]">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">История создания</p>
            <div className="mt-8 space-y-4">
              {ABOUT_HISTORY.map((item) => (
                <article key={item.year} className="rounded-3xl border border-[#DDE8F0] bg-white p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#1A3A6B]">
                      <History className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5CAFD6]">{item.year}</p>
                      <p className="mt-2 leading-relaxed text-[#4B6075]">{item.text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#060E18] p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Сегодня</p>
            <p className="mt-6 leading-relaxed text-white/78">{ABOUT_OVERVIEW}</p>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-white/78">
              {ABOUT_OVERVIEW_DECREES.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#5CAFD6]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-[#DDE8F0] bg-white p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B]">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Профиль</p>
                <h2 className="text-2xl font-black text-[#0D1C2E]">Направления деятельности</h2>
              </div>
            </div>
            <div className="space-y-3">
              {ABOUT_ACTIVITY_DIRECTIONS.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-[#F4F8FB] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#5CAFD6]" />
                  <p className="leading-relaxed text-[#4B6075]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#DDE8F0] bg-white p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B]">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Наука</p>
                <h2 className="text-2xl font-black text-[#0D1C2E]">Научные направления</h2>
              </div>
            </div>
            <div className="space-y-3">
              {ABOUT_SCIENCE_DIRECTIONS.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-[#F4F8FB] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#5CAFD6]" />
                  <p className="leading-relaxed text-[#4B6075]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Структура</p>
          <h2 className="mt-2 text-3xl font-black text-[#0D1C2E]">Ключевые подразделения</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {ABOUT_STRUCTURE.map((item) => (
              <article key={item} className="rounded-3xl border border-[#DDE8F0] bg-white p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#1A3A6B]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold leading-snug text-[#0D1C2E]">{item}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4B6075]">
                      Раздел отражает структуру, указанную заказчиком для публичной версии сайта.
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
