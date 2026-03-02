import { db } from "@/lib/db";
import { departments, teamMembers } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Building2, Users, FlaskConical, Target, Globe, Lightbulb } from "lucide-react";

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
      {/* Hero */}
      <section className="arctic-page-header text-white py-20 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#00E5C0]/50 text-xs font-bold tracking-[0.2em] uppercase mb-3">
            О нас
          </p>
          <h1 className="heading-display text-4xl lg:text-5xl text-white mb-5">О центре</h1>
          <p className="text-white/40 text-lg max-w-2xl leading-relaxed">
            ГБУ АНИЦ — ведущая научная организация Республики Саха (Якутия),
            специализирующаяся на комплексных исследованиях арктических
            и субарктических территорий
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Mission */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          <div className="lg:col-span-3">
            <p className="text-[#00E5C0] text-[10px] font-black uppercase tracking-[0.3em] mb-2">
              Наша миссия
            </p>
            <h2 className="heading-display text-3xl text-white mb-6">
              Наука на службе Арктики
            </h2>
            <p className="text-white/40 leading-relaxed mb-5">
              Арктический научно-исследовательский центр создан для проведения фундаментальных
              и прикладных исследований в области экологии Арктики, климатологии, биологии
              северных экосистем и социально-экономического развития арктических территорий.
            </p>
            <p className="text-white/40 leading-relaxed">
              Центр объединяет ведущих учёных и исследователей, обеспечивает координацию
              научных проектов и международного сотрудничества в сфере арктических исследований.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 gap-3">
            {[
              { icon: Target, title: "Наука", desc: "Фундаментальные и прикладные исследования арктических экосистем" },
              { icon: Users, title: "Команда", desc: `${team.length}+ учёных и специалистов` },
              { icon: Building2, title: "Подразделения", desc: `${depts.length} научных подразделений` },
            ].map((item) => (
              <div key={item.title} className="card-dark p-5 flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-white/5 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-[#00E5C0]/70" />
                </div>
                <div>
                  <p className="font-black text-white uppercase tracking-tight text-sm">{item.title}</p>
                  <p className="text-sm text-white/35 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section>
          <div className="mb-10">
            <p className="text-[#00E5C0] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Принципы</p>
            <h2 className="heading-display text-3xl text-white">Наши ценности</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: Lightbulb, title: "Инновации", desc: "Применение передовых методов и технологий в исследованиях" },
              { icon: Globe, title: "Сотрудничество", desc: "Международная кооперация и обмен знаниями" },
              { icon: Target, title: "Результативность", desc: "Практическая значимость исследований для региона" },
            ].map((v) => (
              <div key={v.title} className="card-dark p-8 flex flex-col gap-5">
                <v.icon className="h-5 w-5 text-[#00E5C0]/50" />
                <div>
                  <h3 className="font-black text-white text-xl uppercase tracking-tight mb-2">{v.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Departments */}
        {depts.length > 0 && (
          <section>
            <div className="mb-8">
              <p className="text-[#00E5C0] text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                Структура
              </p>
              <h2 className="heading-display text-3xl text-white">
                Научные подразделения
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {depts.map((dept) => (
                <Link
                  key={dept.id}
                  href={`/research/departments/${dept.slug}`}
                  className="group card-dark p-6 flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-white/5 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-[#00E5C0]/50" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-[#00E5C0] transition-colors">
                      {dept.name}
                    </h3>
                    {dept.head && (
                      <p className="text-xs text-white/25 mt-1">
                        Руководитель: {dept.head.name}
                      </p>
                    )}
                    {dept.description && (
                      <p className="text-sm text-white/30 mt-2 line-clamp-3 leading-relaxed">{dept.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Team */}
        {team.length > 0 && (
          <section>
            <div className="mb-8">
              <p className="text-[#00E5C0] text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                Люди
              </p>
              <h2 className="heading-display text-3xl text-white">
                Наши сотрудники
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {team.map((member) => (
                <div key={member.id} className="card-dark p-6 text-center">
                  {member.photo ? (
                    <Image
                      src={member.photo.url}
                      alt={member.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover mx-auto mb-4 border-2 border-[#00E5C0]/20"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-white/5 border border-[#00E5C0]/20 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-black text-[#00E5C0]/50">{member.name.charAt(0)}</span>
                    </div>
                  )}
                  <p className="font-bold text-white text-sm">{member.name}</p>
                  {member.position && (
                    <p className="text-xs text-white/30 mt-1">{member.position}</p>
                  )}
                  {member.department && (
                    <p className="text-[10px] text-[#00E5C0]/50 font-black mt-1.5 uppercase tracking-wider">
                      {member.department.name}
                    </p>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-xs text-white/20 hover:text-[#00E5C0] mt-3 block transition-colors"
                    >
                      {member.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
