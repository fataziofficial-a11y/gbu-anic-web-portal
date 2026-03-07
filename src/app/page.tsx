import { db } from "@/lib/db";
import { news, projects, teamMembers } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { logger } from "@/lib/logger";
import Link from "next/link";
import Image from "next/image";
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

type HomeData = {
  latestNews: Awaited<ReturnType<typeof db.query.news.findMany>>;
  activeProjects: Awaited<ReturnType<typeof db.query.projects.findMany>>;
  teamCount: number;
  newsCount: number;
};

async function getHomeData(): Promise<HomeData> {
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

  const stats = [
    { value: newsCount, label: "Публикаций" },
    { value: activeProjects.length, label: "Активных проектов" },
    { value: teamCount, label: "Сотрудников" },
    { value: "13+", label: "Лет исследований" },
  ];

  return (
    <div className="anic-theme flex min-h-screen flex-col bg-white text-[#0F172A]">
      <PublicHeader />
      <main className="flex-1">
        <section className="border-b border-[#EDEDED]">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:py-18">
            <div className="space-y-6">
              <p className="inline-flex rounded-full border border-[#EDEDED] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#3334CC]">
                ГБУ Республики Саха (Якутия)
              </p>
              <h1 className="text-4xl font-semibold leading-[1.05] text-[#0F0F0F] sm:text-5xl lg:text-6xl">
                Арктический центр, который превращает данные в решения
              </h1>
              <p className="max-w-xl text-base leading-7 text-[#878787] sm:text-lg">
                Исследования климата, экосистем и устойчивого развития северных территорий.
                Публикации, аналитика и проекты в едином цифровом портале.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/research"
                  className="inline-flex items-center gap-2 rounded-full bg-[#3334CC] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Исследования
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/knowledge-base"
                  className="inline-flex items-center gap-2 rounded-full border border-[#EDEDED] px-6 py-3 text-sm font-semibold text-[#0F0F0F] transition hover:border-[#3334CC] hover:text-[#3334CC]"
                >
                  База знаний
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={String(s.label)} className="rounded-2xl border border-[#EDEDED] bg-white px-4 py-3">
                    <p className="text-2xl font-semibold text-[#0F0F0F]">{s.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.09em] text-[#878787]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-[#50CD89]/25 blur-2xl" />
              <div className="absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-[#3334CC]/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-[#EDEDED] bg-white p-4">
                <div className="overflow-hidden rounded-2xl">
                  <Image
                    src="/anic-hero.png"
                    alt="Арктические исследования"
                    width={640}
                    height={420}
                    className="h-auto w-full object-cover"
                    priority
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#F8FAFC] p-3">
                    <p className="text-xs text-[#878787]">Новых материалов</p>
                    <p className="mt-1 text-xl font-semibold text-[#0F0F0F]">+128</p>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] p-3">
                    <p className="text-xs text-[#878787]">Открытых проектов</p>
                    <p className="mt-1 text-xl font-semibold text-[#0F0F0F]">24</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#878787]">Направления</p>
              <h2 className="mt-2 text-3xl font-semibold text-[#0F0F0F]">Ключевые области исследований</h2>
            </div>
            <Link href="/research" className="hidden text-sm font-semibold text-[#3334CC] sm:inline-flex">
              Смотреть все
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <article key={area.title} className="rounded-3xl border border-[#EDEDED] bg-white p-7">
                <area.icon className="mb-5 h-6 w-6 text-[#3334CC]" />
                <h3 className="text-xl font-semibold text-[#0F0F0F]">{area.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#878787]">{area.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {latestNews.length > 0 && (
          <section className="mx-auto max-w-[1240px] px-4 py-4 sm:px-6">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#878787]">Актуальное</p>
                <h2 className="mt-2 text-3xl font-semibold text-[#0F0F0F]">Новости</h2>
              </div>
              <Link href="/news" className="text-sm font-semibold text-[#3334CC]">
                Все новости
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {latestNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="rounded-2xl border border-[#EDEDED] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  {item.category && (
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#50CD89]">
                      {item.category}
                    </p>
                  )}
                  <h3 className="line-clamp-4 text-lg font-semibold text-[#0F0F0F]">{item.title}</h3>
                  <p className="mt-5 text-xs text-[#878787]">Подробнее</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {activeProjects.length > 0 && (
          <section className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#878787]">Проекты</p>
                <h2 className="mt-2 text-3xl font-semibold text-[#0F0F0F]">Активные проекты</h2>
              </div>
              <Link href="/research" className="text-sm font-semibold text-[#3334CC]">
                Все проекты
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {activeProjects.map((project) => (
                <article key={project.id} className="rounded-2xl border border-[#EDEDED] bg-white p-6">
                  <FlaskConical className="mb-4 h-5 w-5 text-[#3334CC]" />
                  <h3 className="text-lg font-semibold text-[#0F0F0F]">{project.title}</h3>
                  {project.department && (
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#878787]">{project.department.name}</p>
                  )}
                  {project.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#878787]">{project.description}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto w-full max-w-[1240px] px-4 pb-14 sm:px-6">
          <div className="flex flex-col gap-6 rounded-[28px] border border-[#EDEDED] bg-[#F7F8FF] p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <BookOpen className="mb-3 h-6 w-6 text-[#3334CC]" />
              <h2 className="text-2xl font-semibold text-[#0F0F0F]">База знаний и публикации</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#878787]">
                Доступ к научным материалам, аналитике и методическим публикациям центра.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/knowledge-base"
                className="inline-flex items-center gap-2 rounded-full bg-[#3334CC] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                База знаний
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contacts"
                className="inline-flex items-center gap-2 rounded-full border border-[#D6D6D6] bg-white px-6 py-3 text-sm font-semibold text-[#0F0F0F] transition hover:border-[#3334CC] hover:text-[#3334CC]"
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
