import { db } from "@/lib/db";
import { news, projects, teamMembers } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { AskAI } from "@/components/public/AskAI";
import {
  ArrowRight,
  FlaskConical,
  Thermometer,
  Globe,
  BookOpen,
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

  const stats = [
    { value: newsCount[0]?.count ?? 0, label: "Публикаций" },
    { value: activeProjects.length, label: "Активных проектов" },
    { value: teamCount[0]?.count ?? 0, label: "Сотрудников" },
    { value: "13+", label: "Лет исследований" },
  ];

  return (
    <div className="anic-theme flex min-h-screen flex-col bg-[#eeeeee] text-[#333333]">
      <PublicHeader />
      <main className="flex-1">
        <section className="arctic-hero relative overflow-hidden">
          <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
          <div className="relative z-10 mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-20">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#555555]">
                Государственное бюджетное учреждение
              </p>
              <h1 className="heading-display mb-6 text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
                Арктический научно-исследовательский центр
              </h1>
              <p className="mb-8 max-w-xl text-base leading-relaxed text-[#555555]">
                Ведущий научный центр Республики Саха (Якутия), объединяющий исследования
                в области экологии Арктики, климата, геокриологии и устойчивого развития северных территорий.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/research"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00C9A7] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  Исследования
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d0d0d0] bg-white px-5 py-3 text-sm font-semibold text-[#333333] transition hover:border-[#00C9A7] hover:text-[#00a98b]"
                >
                  О центре
                </Link>
              </div>
            </div>

            <div className="anic-hero-art min-h-[320px] rounded-2xl sm:min-h-[380px] lg:min-h-[440px]" />
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={String(s.label)} className="card-dark rounded-2xl px-5 py-4">
                <p className="text-3xl font-black text-[#111111]">{s.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#777777]">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">Направления</p>
              <h2 className="heading-display mt-2 text-3xl">Ключевые области исследований</h2>
            </div>
            <Link href="/research" className="btn-neon-arrow hidden sm:inline-flex">
              Все направления <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              {
                icon: Thermometer,
                title: "Климатология",
                desc: "Мониторинг климатических изменений и адаптация северных территорий.",
              },
              {
                icon: FlaskConical,
                title: "Экология Арктики",
                desc: "Изучение экосистем, биоразнообразия и антропогенных факторов.",
              },
              {
                icon: Globe,
                title: "Устойчивое развитие",
                desc: "Научная экспертиза для решений в экономике и социальной сфере Арктики.",
              },
            ].map((area) => (
              <article key={area.title} className="card-violet rounded-2xl p-7">
                <area.icon className="mb-4 h-6 w-6 text-[#00a98b]" />
                <h3 className="text-xl font-black text-[#111111]">{area.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#666666]">{area.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {latestNews.length > 0 && (
          <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">Актуальное</p>
                <h2 className="heading-display mt-2 text-3xl">Новости</h2>
              </div>
              <Link href="/news" className="btn-neon-arrow">
                Все новости <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {latestNews.map((item) => (
                <Link key={item.id} href={`/news/${item.slug}`} className="card-dark rounded-2xl p-6">
                  {item.category && (
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#00a98b]">
                      {item.category}
                    </p>
                  )}
                  <h3 className="line-clamp-4 text-lg font-bold text-[#111111]">{item.title}</h3>
                  <p className="mt-4 text-xs text-[#8a8a8a]">Подробнее</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {activeProjects.length > 0 && (
          <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">Проекты</p>
                <h2 className="heading-display mt-2 text-3xl">Активные проекты</h2>
              </div>
              <Link href="/research" className="btn-neon-arrow">
                Все проекты <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {activeProjects.map((project) => (
                <article key={project.id} className="card-dark rounded-2xl p-6">
                  <FlaskConical className="mb-4 h-5 w-5 text-[#00a98b]" />
                  <h3 className="text-lg font-bold text-[#111111]">{project.title}</h3>
                  {project.department && (
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#777777]">{project.department.name}</p>
                  )}
                  {project.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#666666]">{project.description}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="card-violet flex flex-col gap-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <BookOpen className="mb-3 h-6 w-6 text-[#00a98b]" />
              <h2 className="heading-display text-2xl">База знаний и публикации</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#666666]">
                Доступ к научным материалам, аналитике и методическим публикациям центра.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/knowledge-base"
                className="inline-flex items-center gap-2 rounded-xl bg-[#00C9A7] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                База знаний
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contacts"
                className="inline-flex items-center gap-2 rounded-xl border border-[#d0d0d0] bg-white px-5 py-3 text-sm font-semibold text-[#333333] transition hover:border-[#CE2127] hover:text-[#CE2127]"
              >
                Связаться с нами
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
      <AskAI />
    </div>
  );
}
