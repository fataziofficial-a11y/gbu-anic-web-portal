import { db } from "@/lib/db";
import { news, projects, teamMembers } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { logger } from "@/lib/logger";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { AskAI } from "@/components/public/AskAI";
import { ArrowRight, FlaskConical, Thermometer, Globe, BookOpen, Users, FileText, Layers } from "lucide-react";

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
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-[#0D1C2E] pb-20 pt-36 text-white">
          {/* decorative circles */}
          <svg
            className="pointer-events-none absolute right-0 top-0 h-[520px] w-[520px] translate-x-1/3 -translate-y-1/4 opacity-10"
            viewBox="0 0 520 520" fill="none"
          >
            <circle cx="260" cy="260" r="259" stroke="#5CAFD6" strokeWidth="1.5" />
            <circle cx="260" cy="260" r="200" stroke="#5CAFD6" strokeWidth="1" />
            <circle cx="260" cy="260" r="140" stroke="#5CAFD6" strokeWidth="0.8" />
          </svg>
          <svg
            className="pointer-events-none absolute -bottom-24 -left-24 h-[360px] w-[360px] opacity-8"
            viewBox="0 0 360 360" fill="none"
          >
            <circle cx="180" cy="180" r="179" stroke="#5CAFD6" strokeWidth="1" />
            <circle cx="180" cy="180" r="120" stroke="#5CAFD6" strokeWidth="0.8" />
          </svg>

          <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6">
            <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#5CAFD6]">
              ГБУ Республики Саха (Якутия)
            </p>

            <h1 className="max-w-3xl text-[clamp(2.4rem,5vw,4rem)] font-black leading-[1.06] tracking-tight">
              Арктический<br />
              научно&#8209;исследовательский<br />
              центр
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
              Государственное бюджетное учреждение, выполняющее комплексные научные
              исследования Арктики. Данные, аналитика и проекты в едином цифровом портале.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/research"
                className="inline-flex items-center gap-2 rounded-full bg-[#5CAFD6] px-7 py-3.5 text-sm font-bold text-[#0D1C2E] transition hover:bg-[#7CC4E8]"
              >
                Наши исследования
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
              >
                О центре
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { value: newsCount || "40+", label: "Публикаций" },
                { value: activeProjects.length || "10+", label: "Активных проектов" },
                { value: teamCount || "80+", label: "Сотрудников" },
                { value: "13+", label: "Лет исследований" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                  <p className="text-3xl font-black text-white">{s.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.1em] text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Research areas ── */}
        <section className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Направления</p>
              <h2 className="mt-2 text-3xl font-black text-[#0D1C2E] sm:text-4xl">Ключевые области</h2>
            </div>
            <Link href="/research" className="hidden text-sm font-semibold text-[#1A3A6B] hover:underline sm:inline-flex">
              Все исследования →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                icon: Thermometer,
                title: "Климатология",
                desc: "Мониторинг климатических изменений и адаптация северных территорий.",
                color: "bg-[#EEF4FB]",
                iconColor: "text-[#1A3A6B]",
              },
              {
                icon: FlaskConical,
                title: "Экология Арктики",
                desc: "Изучение экосистем, биоразнообразия и антропогенных факторов.",
                color: "bg-[#E8F5F0]",
                iconColor: "text-[#1A7A5A]",
              },
              {
                icon: Globe,
                title: "Устойчивое развитие",
                desc: "Научная экспертиза для решений в экономике и социальной сфере Арктики.",
                color: "bg-[#F5F0EE]",
                iconColor: "text-[#8B4B2A]",
              },
            ].map((area) => (
              <article key={area.title} className={`rounded-3xl ${area.color} p-8`}>
                <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 ${area.iconColor}`}>
                  <area.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-[#0D1C2E]">{area.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4B6075]">{area.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Latest news ── */}
        {latestNews.length > 0 && (
          <section className="bg-[#F7FAFD] py-20">
            <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
              <div className="mb-10 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Актуальное</p>
                  <h2 className="mt-2 text-3xl font-black text-[#0D1C2E] sm:text-4xl">Новости</h2>
                </div>
                <Link href="/news" className="text-sm font-semibold text-[#1A3A6B] hover:underline">
                  Все новости →
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {latestNews.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="group flex flex-col rounded-2xl border border-[#DDE8F0] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {item.category && (
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#5CAFD6]">
                        {item.category}
                      </p>
                    )}
                    <h3 className="line-clamp-4 flex-1 text-lg font-bold text-[#0D1C2E] group-hover:text-[#1A3A6B]">
                      {item.title}
                    </h3>
                    <p className="mt-5 text-xs font-semibold text-[#1A3A6B]">Читать →</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Active projects ── */}
        {activeProjects.length > 0 && (
          <section className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5CAFD6]">Проекты</p>
                <h2 className="mt-2 text-3xl font-black text-[#0D1C2E] sm:text-4xl">Активные проекты</h2>
              </div>
              <Link href="/research" className="text-sm font-semibold text-[#1A3A6B] hover:underline">
                Все проекты →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {activeProjects.map((project) => (
                <article key={project.id} className="flex flex-col rounded-2xl border border-[#DDE8F0] bg-white p-6">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B]">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <h3 className="flex-1 text-lg font-bold text-[#0D1C2E]">{project.title}</h3>
                  {project.department && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#5CAFD6]">
                      {project.department.name}
                    </p>
                  )}
                  {project.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#4B6075]">{project.description}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA banner ── */}
        <section className="bg-[#0D1C2E] py-20 text-white">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
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
                <div key={block.title} className="flex flex-col">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#5CAFD6]">
                    <block.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{block.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50">{block.desc}</p>
                  <Link
                    href={block.href}
                    className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#5CAFD6] hover:text-[#5CAFD6]"
                  >
                    {block.cta} <ArrowRight className="h-4 w-4" />
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
