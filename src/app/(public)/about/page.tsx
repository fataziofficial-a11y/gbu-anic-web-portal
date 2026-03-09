import { db } from "@/lib/db";
import { departments, teamMembers } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { Building2, Users, Target, Globe, Lightbulb } from "lucide-react";
import { PageBanner } from "@/components/public/PageBanner";

export const metadata: Metadata = { title: "О центре" };
export const revalidate = 3600;

export default async function AboutPage() {
  const [depts, team] = await Promise.all([
    db.query.departments.findMany({
      orderBy: [asc(departments.sortOrder)],
      with: { head: { columns: { name: true, position: true } } },
    }),
    db.query.teamMembers.findMany({
      orderBy: [asc(teamMembers.sortOrder), asc(teamMembers.name)],
      with: { department: { columns: { name: true } }, photo: { columns: { url: true } } },
      limit: 12,
    }),
  ]);

  return (
    <div>
      {/* Page hero — ANL-style dark banner */}
      <PageBanner
        eyebrow="О нас"
        title="О центре"
        description="ГБУ АНИЦ — ведущая научная организация Республики Саха (Якутия), специализирующаяся на комплексных исследованиях арктических и субарктических территорий."
      />

      <div className="mx-auto max-w-[1240px] space-y-20 px-4 py-16 sm:px-6">
        {/* Mission */}
        <section className="grid grid-cols-1 items-start gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[2px] w-6 bg-[#5CAFD6]" />
              <span className="text-[#5CAFD6] text-[11px] font-black uppercase tracking-[0.22em]">Наша миссия</span>
            </div>
            <h2 className="mt-2 text-3xl font-black text-[#0D1C2E]">Наука на службе Арктики</h2>
            <p className="mt-6 leading-relaxed text-[#4B6075]">
              Арктический научно-исследовательский центр создан для проведения фундаментальных
              и прикладных исследований в области экологии Арктики, климатологии, биологии
              северных экосистем и социально-экономического развития арктических территорий.
            </p>
            <p className="mt-4 leading-relaxed text-[#4B6075]">
              Центр объединяет ведущих учёных и исследователей, обеспечивает координацию
              научных проектов и международного сотрудничества в сфере арктических исследований.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:col-span-2">
            {[
              { icon: Target, title: "Наука", desc: "Фундаментальные и прикладные исследования арктических экосистем" },
              { icon: Users, title: "Команда", desc: `${team.length}+ учёных и специалистов` },
              { icon: Building2, title: "Подразделения", desc: `${depts.length} научных подразделений` },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-[#DDE8F0] bg-white p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B]">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-[#0D1C2E]">{item.title}</p>
                  <p className="mt-0.5 text-sm text-[#4B6075]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Принципы</p>
          <h2 className="mt-2 text-3xl font-black text-[#0D1C2E]">Наши ценности</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { icon: Lightbulb, title: "Инновации", desc: "Применение передовых методов и технологий в исследованиях", color: "bg-[#EEF4FB]" },
              { icon: Globe, title: "Сотрудничество", desc: "Международная кооперация и обмен знаниями", color: "bg-[#E8F5F0]" },
              { icon: Target, title: "Результативность", desc: "Практическая значимость исследований для региона", color: "bg-[#F5F0EE]" },
            ].map((v) => (
              <div key={v.title} className={`flex flex-col gap-5 rounded-3xl ${v.color} p-8`}>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-[#1A3A6B]">
                  <v.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0D1C2E]">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4B6075]">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Departments */}
        {depts.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Структура</p>
            <h2 className="mt-2 text-3xl font-black text-[#0D1C2E]">Научные подразделения</h2>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {depts.map((dept) => (
                <Link
                  key={dept.id}
                  href={`/research/departments/${dept.slug}`}
                  className="group flex items-start gap-4 rounded-2xl border border-[#DDE8F0] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0D1C2E] transition-colors group-hover:text-[#1A3A6B]">
                      {dept.name}
                    </h3>
                    {dept.head && (
                      <p className="mt-1 text-xs text-[#8B9BAD]">Руководитель: {dept.head.name}</p>
                    )}
                    {dept.description && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#4B6075]">{dept.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Team section intentionally hidden — will be added later with photos */}
      </div>
    </div>
  );
}
