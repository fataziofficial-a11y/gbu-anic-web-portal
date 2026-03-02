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
          <p className="text-glacial-light/50 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            О нас
          </p>
          <h1 className="heading-serif text-4xl lg:text-5xl text-white mb-5">О центре</h1>
          <p className="text-slate-300/70 text-lg max-w-2xl leading-relaxed">
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
            <p className="text-xs font-semibold text-glacial uppercase tracking-[0.15em] mb-3">
              Наша миссия
            </p>
            <h2 className="heading-serif text-3xl text-arctic-900 mb-6">
              Наука на службе Арктики
            </h2>
            <p className="text-slate-600 leading-relaxed mb-5">
              Арктический научно-исследовательский центр создан для проведения фундаментальных
              и прикладных исследований в области экологии Арктики, климатологии, биологии
              северных экосистем и социально-экономического развития арктических территорий.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Центр объединяет ведущих учёных и исследователей, обеспечивает координацию
              научных проектов и международного сотрудничества в сфере арктических исследований.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 gap-4">
            {[
              { icon: Target, title: "Наука", desc: "Фундаментальные и прикладные исследования арктических экосистем" },
              { icon: Users, title: "Команда", desc: `${team.length}+ учёных и специалистов` },
              { icon: Building2, title: "Подразделения", desc: `${depts.length} научных подразделений` },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 bg-white rounded-2xl border border-slate-200/80 p-5 card-hover">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-glacial/8 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-glacial" />
                </div>
                <div>
                  <p className="font-semibold text-arctic-900">{item.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section>
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-glacial uppercase tracking-[0.15em] mb-2">Принципы</p>
            <h2 className="heading-serif text-3xl text-arctic-900">Наши ценности</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Lightbulb, title: "Инновации", desc: "Применение передовых методов и технологий в исследованиях" },
              { icon: Globe, title: "Сотрудничество", desc: "Международная кооперация и обмен знаниями" },
              { icon: Target, title: "Результативность", desc: "Практическая значимость исследований для региона" },
            ].map((v) => (
              <div key={v.title} className="group relative bg-white rounded-2xl border border-slate-200/80 p-8 text-center card-hover overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-glacial to-aurora-teal opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
                <v.icon className="h-8 w-8 text-glacial mx-auto mb-4" />
                <h3 className="heading-serif text-xl text-arctic-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Departments */}
        {depts.length > 0 && (
          <section>
            <div className="mb-8">
              <p className="text-xs font-semibold text-glacial uppercase tracking-[0.15em] mb-2">
                Структура
              </p>
              <h2 className="heading-serif text-3xl text-arctic-900">
                Научные подразделения
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {depts.map((dept) => (
                <Link
                  key={dept.id}
                  href={`/research/departments/${dept.slug}`}
                  className="group block bg-white rounded-2xl border border-slate-200/80 p-6 card-hover accent-border-hover"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-glacial/8 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-glacial" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-arctic-900 group-hover:text-glacial-dark transition-colors">
                        {dept.name}
                      </h3>
                      {dept.head && (
                        <p className="text-xs text-slate-500 mt-1">
                          Руководитель: {dept.head.name}
                        </p>
                      )}
                      {dept.description && (
                        <p className="text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed">{dept.description}</p>
                      )}
                    </div>
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
              <p className="text-xs font-semibold text-glacial uppercase tracking-[0.15em] mb-2">
                Люди
              </p>
              <h2 className="heading-serif text-3xl text-arctic-900">
                Наши сотрудники
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {team.map((member) => (
                <div key={member.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center card-hover">
                  {member.photo ? (
                    <Image
                      src={member.photo.url}
                      alt={member.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-2 ring-glacial/10 ring-offset-2"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-arctic-100 to-arctic-50 flex items-center justify-center mx-auto mb-4 ring-2 ring-glacial/10 ring-offset-2">
                      <span className="text-2xl font-serif font-bold text-arctic-600">{member.name.charAt(0)}</span>
                    </div>
                  )}
                  <p className="font-semibold text-arctic-900">{member.name}</p>
                  {member.position && (
                    <p className="text-xs text-slate-500 mt-1">{member.position}</p>
                  )}
                  {member.department && (
                    <p className="text-[10px] text-glacial font-medium mt-1.5 uppercase tracking-wider">
                      {member.department.name}
                    </p>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-xs text-slate-400 hover:text-glacial mt-3 block transition-colors"
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
