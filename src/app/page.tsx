import { db } from "@/lib/db";
import { news, projects, teamMembers } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import {
  ArrowRight,
  FlaskConical,
  Users,
  Mountain,
  BookOpen,
  Thermometer,
  Globe,
  Layers,
} from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  const [latestNews, activeProjects, teamCount, newsCount] = await Promise.all([
    db.query.news.findMany({
      where: eq(news.status, "published"),
      orderBy: [desc(news.publishedAt)],
      limit: 3,
      columns: { id: true, title: true, slug: true, category: true, publishedAt: true },
    }),
    db.query.projects.findMany({
      where: eq(projects.status, "active"),
      orderBy: [desc(projects.createdAt)],
      limit: 3,
      with: { department: true },
    }),
    db.select({ count: count() }).from(teamMembers),
    db.select({ count: count() }).from(news).where(eq(news.status, "published")),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#050E1C]">
      <PublicHeader />
      <main className="flex-1 pt-[56px]">

        {/* ===== HERO ===== */}
        <section className="relative arctic-hero text-white overflow-hidden min-h-[88vh] flex items-center">
          <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
            <div className="max-w-4xl">
              <p className="text-[#00E5C0]/60 text-[10px] font-bold tracking-[0.3em] uppercase mb-6">
                Государственное бюджетное учреждение · Республика Саха (Якутия)
              </p>
              <h1 className="heading-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-white mb-8 leading-[0.9]">
                Арктический{" "}
                <span className="text-[#00E5C0]">научно-</span>
                <br />
                исследовательский
                <br />
                центр
              </h1>
              <p className="text-white/40 text-base lg:text-lg max-w-lg mb-10 font-light leading-relaxed">
                Ведущий научный центр РС(Я) в сфере изучения арктических экосистем,
                климатических процессов и историко-культурного наследия Севера
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/research"
                  className="inline-flex items-center gap-2 bg-[#00E5C0] text-[#050E1C] px-6 py-3 font-black text-sm uppercase tracking-wider hover:bg-[#00E5C0]/90 transition-colors"
                >
                  Исследования
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 border border-white/20 text-white/70 px-6 py-3 font-bold text-sm uppercase tracking-wider hover:border-white/40 hover:text-white transition-colors"
                >
                  О центре
                </Link>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px border border-white/5 bg-white/5">
              {[
                { value: newsCount[0].count.toString(), label: "Публикаций" },
                { value: `${activeProjects.length}+`, label: "Активных проектов" },
                { value: teamCount[0].count.toString(), label: "Учёных" },
                { value: "13+", label: "Лет исследований" },
              ].map((s) => (
                <div key={s.label} className="bg-[#050E1C] p-6 text-center">
                  <p className="text-3xl font-black text-white">{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FEATURED TILES ===== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: "/about", label: "О центре", sub: "История, миссия и команда", icon: Globe },
              { href: "/research", label: "Исследования", sub: "Проекты и экспедиции", icon: FlaskConical },
              { href: "/media", label: "Медиа", sub: "Видео и фотоотчёты", icon: Layers },
              { href: "/partners", label: "Партнёрам", sub: "Сотрудничество с АНИЦ", icon: Users },
            ].map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                className="group card-violet p-7 flex flex-col justify-between min-h-[180px] hover:brightness-110 transition-all"
              >
                <tile.icon className="h-6 w-6 text-[#00E5C0]/60" />
                <div>
                  <h3 className="text-white font-black text-xl uppercase tracking-tight mb-1">{tile.label}</h3>
                  <p className="text-white/30 text-xs font-medium">{tile.sub}</p>
                  <div className="btn-neon-arrow mt-3">
                    Подробнее <ArrowRight className="h-3.5 w-3.5 inline" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== NEWS ===== */}
        {latestNews.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[#00E5C0] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Актуальное</p>
                <h2 className="heading-display text-4xl lg:text-5xl text-white">Новости</h2>
              </div>
              <Link href="/news" className="btn-neon-arrow hidden sm:flex items-center gap-1.5">
                Все новости <ArrowRight className="h-4 w-4 inline" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {latestNews.map((item) => {
                const d = item.publishedAt ? new Date(item.publishedAt) : null;
                const dayMonth = d
                  ? `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`
                  : null;
                return (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="group card-dark p-6 flex flex-col justify-between min-h-[200px] relative overflow-hidden"
                  >
                    {dayMonth && (
                      <span className="absolute top-2 right-3 text-[64px] font-black text-white/[0.04] leading-none select-none pointer-events-none">
                        {dayMonth}
                      </span>
                    )}
                    <div>
                      {item.category && (
                        <span className="text-[#00E5C0] text-[10px] font-black uppercase tracking-widest mb-3 block">
                          #{item.category}
                        </span>
                      )}
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-[#00E5C0] transition-colors line-clamp-4">
                        {item.title}
                      </h3>
                    </div>
                    {dayMonth && (
                      <p className="text-white/20 text-xs font-bold mt-4">{dayMonth}</p>
                    )}
                  </Link>
                );
              })}
            </div>
            <Link href="/news" className="btn-neon-arrow sm:hidden flex items-center gap-1.5 mt-6">
              Все новости <ArrowRight className="h-4 w-4 inline" />
            </Link>
          </section>
        )}

        {/* ===== RESEARCH DIRECTIONS ===== */}
        <section className="border-t border-[#00E5C0]/8 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <p className="text-[#00E5C0] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Направления</p>
              <h2 className="heading-display text-4xl lg:text-5xl text-white">Области исследований</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  num: "01",
                  icon: Thermometer,
                  title: "Климатология",
                  desc: "Мониторинг и прогнозирование климатических изменений в арктическом регионе",
                },
                {
                  num: "02",
                  icon: FlaskConical,
                  title: "Экология Арктики",
                  desc: "Изучение экосистем тундры, вечной мерзлоты и биоразнообразия северных территорий",
                },
                {
                  num: "03",
                  icon: Mountain,
                  title: "Геокриология",
                  desc: "Исследования многолетнемёрзлых грунтов и криогенных процессов Севера",
                },
              ].map((area) => (
                <div key={area.num} className="card-dark p-8 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[40px] font-black text-white/[0.06] leading-none">{area.num}</span>
                    <area.icon className="h-5 w-5 text-[#00E5C0]/50" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-xl uppercase tracking-tight mb-2">{area.title}</h3>
                    <p className="text-white/35 text-sm leading-relaxed">{area.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== ACTIVE PROJECTS ===== */}
        {activeProjects.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[#00E5C0] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Наука</p>
                <h2 className="heading-display text-4xl lg:text-5xl text-white">Активные проекты</h2>
              </div>
              <Link href="/research" className="btn-neon-arrow hidden sm:flex items-center gap-1.5">
                Все проекты <ArrowRight className="h-4 w-4 inline" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeProjects.map((project) => (
                <div key={project.id} className="card-violet p-7">
                  <div className="w-8 h-8 rounded bg-[#00E5C0]/10 flex items-center justify-center mb-5">
                    <FlaskConical className="h-4 w-4 text-[#00E5C0]/70" />
                  </div>
                  <h3 className="font-bold text-white leading-snug mb-3">{project.title}</h3>
                  {project.department && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#00E5C0]/40">
                      {project.department.name}
                    </p>
                  )}
                  {project.description && (
                    <p className="text-white/30 text-sm mt-3 line-clamp-2 leading-relaxed">{project.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== CTA ===== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="border border-[#00E5C0]/20 p-10 lg:p-14 flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <BookOpen className="h-7 w-7 text-[#00E5C0] mb-4 mx-auto lg:mx-0" />
              <h2 className="heading-display text-3xl text-white mb-3">База знаний</h2>
              <p className="text-white/35 max-w-md mx-auto lg:mx-0 leading-relaxed">
                Научные статьи, методические материалы и результаты исследований арктического региона
              </p>
            </div>
            <Link
              href="/knowledge-base"
              className="inline-flex items-center gap-2 bg-[#00E5C0] text-[#050E1C] px-7 py-3.5 font-black text-sm uppercase tracking-wider hover:bg-[#00E5C0]/90 transition-colors flex-shrink-0"
            >
              Открыть базу знаний
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
}
