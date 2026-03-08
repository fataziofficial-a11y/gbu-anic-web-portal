import { db } from "@/lib/db";
import { news, projects, teamMembers } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { logger } from "@/lib/logger";
import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { AskAI } from "@/components/public/AskAI";
import { ArrowRight, FlaskConical, Calendar, BookOpen, Users, Layers, ChevronRight } from "lucide-react";

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
        columns: { id: true, title: true, slug: true, category: true, publishedAt: true, excerpt: true },
        with: { coverImage: { columns: { url: true, altText: true } } },
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

// Gradient placeholders for news cards without photos
const NEWS_PLACEHOLDERS = [
  "from-[#1A3A6B] to-[#0D1C2E]",
  "from-[#0D4F8C] to-[#1A3A6B]",
  "from-[#2C5F8A] to-[#060E18]",
];

// Research area cards
const RESEARCH_AREAS = [
  {
    title: "Климатология",
    desc: "Мониторинг климатических изменений и разработка моделей адаптации северных территорий к глобальному потеплению.",
    num: "01",
    img: "/images/card-climate.jpg",
  },
  {
    title: "Экология Арктики",
    desc: "Изучение экосистем, биоразнообразия арктических регионов и влияния антропогенных факторов на природную среду.",
    num: "02",
    img: "/images/card-ecology.jpg",
  },
  {
    title: "Устойчивое развитие",
    desc: "Научная экспертиза и прикладные решения для экономики и социальной сферы арктических территорий.",
    num: "03",
    img: "/images/card-sustainability.jpg",
  },
];

export default async function HomePage() {
  const { latestNews, activeProjects, teamCount, newsCount } = await getHomeData();

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#0D1C2E]">
      <PublicHeader />

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section
          className="relative bg-[#060E18] text-white overflow-hidden"
          style={{ minHeight: "92vh" }}
        >
          {/* Background photo */}
          <div className="absolute inset-0">
            <Image
              src="/images/hero-arctic.jpg"
              alt="Арктический пейзаж"
              fill
              priority
              className="object-cover object-center opacity-40"
              sizes="100vw"
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#060E18] via-[#060E18]/80 to-[#060E18]/30" />
          </div>

          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none select-none">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#5CAFD6]" />
          </div>

          {/* Hero content */}
          <div
            className="relative mx-auto max-w-[1240px] px-4 sm:px-6 flex flex-col justify-center"
            style={{ minHeight: "92vh", paddingTop: "120px", paddingBottom: "80px" }}
          >
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

            {/* Areas grid with photos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {RESEARCH_AREAS.map((area) => (
                <article key={area.title} className="group relative overflow-hidden" style={{ minHeight: "320px" }}>
                  {/* Background photo */}
                  <Image
                    src={area.img}
                    alt={area.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060E18] via-[#060E18]/60 to-[#060E18]/20" />
                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <p className="text-[10px] font-black text-[#5CAFD6]/60 tracking-[0.2em] mb-3">{area.num}</p>
                    <h3 className="text-xl font-black text-white mb-3">{area.title}</h3>
                    <p className="text-sm leading-relaxed text-white/60">{area.desc}</p>
                    <div className="mt-5 h-[2px] w-0 bg-[#5CAFD6] group-hover:w-12 transition-all duration-300" />
                  </div>
                </article>
              ))}
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

              {/* News feed — same style as /news page */}
              <div className="space-y-4">
                {latestNews.map((item, i) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="group flex gap-5 bg-white border border-[#DDE8F0] hover:border-[#5CAFD6]/40 transition-colors overflow-hidden"
                  >
                    {/* Cover image / placeholder */}
                    <div className="relative shrink-0 w-[200px] sm:w-[240px] overflow-hidden">
                      {item.coverImage?.url ? (
                        <Image
                          src={item.coverImage.url}
                          alt={item.coverImage.altText ?? item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="240px"
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${NEWS_PLACEHOLDERS[i % NEWS_PLACEHOLDERS.length]}`} />
                      )}
                    </div>
                    {/* Text */}
                    <div className="flex flex-col justify-center py-5 pr-6 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        {item.category && (
                          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5CAFD6] border border-[#5CAFD6]/30 px-2.5 py-1">
                            {item.category}
                          </span>
                        )}
                        {item.publishedAt && (
                          <span className="flex items-center gap-1 text-[11px] text-[#8EA8C0]">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.publishedAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[1.05rem] font-bold text-[#0D1C2E] leading-snug group-hover:text-[#1A3A6B] line-clamp-2 transition-colors mb-2">
                        {item.title}
                      </h3>
                      {item.excerpt && (
                        <p className="text-sm text-[#4B6075] leading-relaxed line-clamp-2">{item.excerpt}</p>
                      )}
                      <div className="mt-4 flex items-center gap-2 text-[12px] font-black text-[#5CAFD6] uppercase tracking-[0.12em]">
                        Читать далее <ArrowRight className="h-3.5 w-3.5" />
                      </div>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeProjects.map((project) => (
                  <article key={project.id} className="group relative overflow-hidden" style={{ minHeight: "260px" }}>
                    {/* Background photo */}
                    <Image
                      src="/images/card-research.jpg"
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060E18] via-[#060E18]/70 to-[#060E18]/30" />
                    <div className="absolute inset-0 flex flex-col justify-end p-7">
                      {project.department && (
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5CAFD6] mb-2">
                          {project.department.name}
                        </p>
                      )}
                      <h3 className="text-[1rem] font-bold text-white leading-snug">{project.title}</h3>
                      {project.description && (
                        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-white/55">{project.description}</p>
                      )}
                    </div>
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
                { icon: BookOpen, title: "База знаний", desc: "Научные материалы, аналитика и методические публикации центра.", href: "/knowledge-base", cta: "Перейти" },
                { icon: Layers, title: "Документы", desc: "Нормативные акты, уставные документы и отчёты о деятельности.", href: "/documents", cta: "Открыть" },
                { icon: Users, title: "Партнёрам", desc: "Информация о сотрудничестве, грантах и совместных проектах.", href: "/partners", cta: "Узнать больше" },
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
