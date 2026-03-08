import { db } from "@/lib/db";
import { news, projects, teamMembers } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { logger } from "@/lib/logger";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { AskAI } from "@/components/public/AskAI";
import { ArrowRight, FlaskConical, Thermometer, Globe, BookOpen, Users, FileText, Layers, ChevronRight } from "lucide-react";

export const revalidate = 60;

async function getHomeData() {
  if (!process.env.DATABASE_URL) {
    logger.warn("HomePage: DATABASE_URL is not set, rendering fallback data");
    return { latestNews: [], activeProjects: [], teamCount: 0, newsCount: 0 };
  }

  try {
    const [latestNews, activeProjects, teamCountRows, newsCountRows] = await Promise.all([
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

    return {
      latestNews,
      activeProjects,
      teamCount: teamCountRows[0]?.count ?? 0,
      newsCount: newsCountRows[0]?.count ?? 0,
    };
  } catch (error) {
    logger.error("HomePage: failed to load data, rendering fallback", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { latestNews: [], activeProjects: [], teamCount: 0, newsCount: 0 };
  }
}

export default async function HomePage() {
  const { latestNews, activeProjects, teamCount, newsCount } = await getHomeData();

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#0D1C2E]">
      <PublicHeader />

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative bg-[#060E18] text-white overflow-hidden" style={{ minHeight: "92vh" }}>

          {/* Angular geometric overlay — ANL-style structural element */}
          <div className="absolute inset-0 pointer-events-none select-none">
            {/* Right diagonal panel */}
            <div
              className="absolute right-0 top-0 h-full w-[55%] origin-top-right"
              style={{
                background: "linear-gradient(135deg, transparent 30%, #0D1C2E 30%)",
                opacity: 0.6,
              }}
            />
            {/* Cyan accent line — top */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#5CAFD6]" />
            {/* Grid dots pattern */}
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(#5CAFD6 1px, transparent 1px)", backgroundSize: "32px 32px" }}
            />
            {/* Large circle — right side decorative */}
            <svg className="absolute right-[-120px] top-[-60px] h-[600px] w-[600px] opacity-[0.06]" viewBox="0 0 600 600" fill="none">
              <circle cx="300" cy="300" r="298" stroke="#5CAFD6" strokeWidth="1" />
              <circle cx="300" cy="300" r="230" stroke="#5CAFD6" strokeWidth="0.8" />
              <circle cx="300" cy="300" r="155" stroke="#5CAFD6" strokeWidth="0.6" />
            </svg>
          </div>

          {/* Hero content */}
          <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 flex flex-col justify-center" style={{ minHeight: "92vh", paddingTop: "120px", paddingBottom: "80px" }}>

            {/* Eyebrow label */}
            <div className="flex items-start gap-3 mb-8 max-w-[42ch]">
              <div className="h-[2px] w-8 bg-[#5CAFD6] shrink-0 mt-[6px]" />
              <span className="text-[#5CAFD6] text-[11px] font-black uppercase tracking-[0.18em] leading-relaxed">
                Арктический научно-исследовательский центр Республики Саха (Якутия)
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-[clamp(2.4rem,5.5vw,4.5rem)] font-black leading-[1.05] tracking-tight max-w-[18ch] mb-8">
              Наука для развития Арктики
            </h1>

            <p className="max-w-[48ch] text-[clamp(0.95rem,1.4vw,1.1rem)] leading-7 text-white/55 mb-10">
              Исследования и научная основа для устойчивого развития Севера
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-20">
              <Link
                href="/research"
                className="inline-flex items-center gap-2.5 bg-[#5CAFD6] text-[#060E18] px-8 py-4 text-[13px] font-black uppercase tracking-[0.1em] transition-colors hover:bg-[#7CC4E8]"
              >
                Наши исследования
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2.5 border border-white/25 text-white px-8 py-4 text-[13px] font-bold uppercase tracking-[0.1em] transition-colors hover:border-[#5CAFD6] hover:text-[#5CAFD6]"
              >
                О центре
              </Link>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-t border-white/10">
              {[
                { value: newsCount > 0 ? `${newsCount}+` : "40+", label: "Публикаций" },
                { value: activeProjects.length > 0 ? `${activeProjects.length}+` : "10+", label: "Активных проектов" },
                { value: teamCount > 0 ? `${teamCount}+` : "80+", label: "Сотрудников" },
                { value: "13+", label: "Лет исследований" },
              ].map((s, i) => (
                <div key={s.label} className={`py-6 pr-8 ${i < 3 ? "sm:border-r border-white/10" : ""}`}>
                  <p className="text-[2.5rem] font-black text-white leading-none">{s.value}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/40">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Research areas ────────────────────────────────────────── */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">

            {/* Section header */}
            <div className="flex items-end justify-between gap-6 mb-14">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-[2px] w-6 bg-[#5CAFD6]" />
                  <span className="text-[#5CAFD6] text-[11px] font-black uppercase tracking-[0.22em]">Направления</span>
                </div>
                <h2 className="text-[clamp(1.8rem,3.5vw,2.75rem)] font-black text-[#0D1C2E] leading-[1.05]">
                  Ключевые области<br className="hidden sm:block" /> исследований
                </h2>
              </div>
              <Link href="/research" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1A3A6B] border-b border-[#1A3A6B]/30 pb-0.5 hover:border-[#1A3A6B] transition-colors shrink-0">
                Все исследования <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Areas grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#DDE8F0]">
              {[
                {
                  icon: Thermometer,
                  title: "Климатология",
                  desc: "Мониторинг климатических изменений и разработка моделей адаптации северных территорий к глобальному потеплению.",
                  num: "01",
                },
                {
                  icon: FlaskConical,
                  title: "Экология Арктики",
                  desc: "Изучение экосистем, биоразнообразия арктических регионов и влияния антропогенных факторов на природную среду.",
                  num: "02",
                },
                {
                  icon: Globe,
                  title: "Устойчивое развитие",
                  desc: "Научная экспертиза и прикладные решения для экономики и социальной сферы арктических территорий.",
                  num: "03",
                },
              ].map((area) => (
                <article key={area.title} className="bg-white p-10 group hover:bg-[#F4F8FB] transition-colors">
                  <p className="text-[11px] font-black text-[#DDE8F0] tracking-[0.2em] mb-8">{area.num}</p>
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center bg-[#EEF4FB] text-[#1A3A6B]">
                    <area.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-[#0D1C2E] mb-3">{area.title}</h3>
                  <p className="text-sm leading-relaxed text-[#4B6075]">{area.desc}</p>
                  <div className="mt-8 h-[2px] w-0 bg-[#5CAFD6] group-hover:w-12 transition-all duration-300" />
                </article>
              ))}
            </div>

            <div className="mt-6 sm:hidden">
              <Link href="/research" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1A3A6B]">
                Все исследования <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Latest news ───────────────────────────────────────────── */}
        {latestNews.length > 0 && (
          <section className="bg-[#F4F8FB] py-24 border-y border-[#DDE8F0]">
            <div className="mx-auto max-w-[1240px] px-4 sm:px-6">

              <div className="flex items-end justify-between gap-6 mb-14">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-[2px] w-6 bg-[#5CAFD6]" />
                    <span className="text-[#5CAFD6] text-[11px] font-black uppercase tracking-[0.22em]">Актуальное</span>
                  </div>
                  <h2 className="text-[clamp(1.8rem,3.5vw,2.75rem)] font-black text-[#0D1C2E] leading-[1.05]">
                    Последние новости
                  </h2>
                </div>
                <Link href="/news" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1A3A6B] border-b border-[#1A3A6B]/30 pb-0.5 hover:border-[#1A3A6B] transition-colors shrink-0">
                  Все новости <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#DDE8F0]">
                {latestNews.map((item, i) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="group flex flex-col bg-white p-8 hover:bg-[#EEF4FB] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-6">
                      {item.category && (
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5CAFD6] border border-[#5CAFD6]/30 px-2.5 py-1">
                          {item.category}
                        </span>
                      )}
                      <span className="text-[11px] text-[#8EA8C0] ml-auto">
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })
                          : ""}
                      </span>
                    </div>
                    <h3 className="flex-1 text-[1.05rem] font-bold text-[#0D1C2E] leading-snug group-hover:text-[#1A3A6B] line-clamp-4 transition-colors">
                      {item.title}
                    </h3>
                    <div className="mt-6 flex items-center gap-2 text-[12px] font-black text-[#5CAFD6] uppercase tracking-[0.12em]">
                      Читать <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Active projects ───────────────────────────────────────── */}
        {activeProjects.length > 0 && (
          <section className="bg-white py-24">
            <div className="mx-auto max-w-[1240px] px-4 sm:px-6">

              <div className="flex items-end justify-between gap-6 mb-14">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-[2px] w-6 bg-[#5CAFD6]" />
                    <span className="text-[#5CAFD6] text-[11px] font-black uppercase tracking-[0.22em]">Проекты</span>
                  </div>
                  <h2 className="text-[clamp(1.8rem,3.5vw,2.75rem)] font-black text-[#0D1C2E] leading-[1.05]">
                    Активные проекты
                  </h2>
                </div>
                <Link href="/research" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1A3A6B] border-b border-[#1A3A6B]/30 pb-0.5 hover:border-[#1A3A6B] transition-colors shrink-0">
                  Все проекты <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#DDE8F0]">
                {activeProjects.map((project) => (
                  <article key={project.id} className="bg-white p-8 hover:bg-[#F4F8FB] transition-colors">
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center bg-[#EEF4FB] text-[#1A3A6B]">
                      <FlaskConical className="h-6 w-6" />
                    </div>
                    {project.department && (
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5CAFD6] mb-3">
                        {project.department.name}
                      </p>
                    )}
                    <h3 className="text-[1.05rem] font-bold text-[#0D1C2E] leading-snug">{project.title}</h3>
                    {project.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#4B6075]">{project.description}</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Quick links (dark band) ───────────────────────────────── */}
        <section className="bg-[#060E18] py-20 border-t-[3px] border-[#5CAFD6]">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/5">
              {[
                {
                  icon: BookOpen,
                  title: "База знаний",
                  desc: "Научные материалы, аналитика и методические публикации центра.",
                  href: "/knowledge-base",
                  cta: "Перейти",
                },
                {
                  icon: Layers,
                  title: "Документы",
                  desc: "Нормативные акты, уставные документы и отчёты о деятельности.",
                  href: "/documents",
                  cta: "Открыть",
                },
                {
                  icon: Users,
                  title: "Партнёрам",
                  desc: "Информация о сотрудничестве, грантах и совместных проектах.",
                  href: "/partners",
                  cta: "Узнать больше",
                },
              ].map((block) => (
                <div key={block.title} className="bg-[#060E18] p-10 group hover:bg-[#0D1C2E] transition-colors">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center border border-white/10 text-[#5CAFD6]">
                    <block.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">{block.title}</h3>
                  <p className="text-sm leading-relaxed text-white/40 mb-8">{block.desc}</p>
                  <Link
                    href={block.href}
                    className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.12em] text-[#5CAFD6] border-b border-[#5CAFD6]/30 pb-1 hover:border-[#5CAFD6] transition-colors"
                  >
                    {block.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <PublicFooter />
      <AskAI />
    </div>
  );
}
