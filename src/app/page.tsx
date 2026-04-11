import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { AskAI } from "@/components/public/AskAI";
import { ArrowRight, Calendar, BookOpen, Users, Layers, ChevronRight } from "lucide-react";
import {
  CENTER_DESCRIPTION_PARAGRAPHS,
  CENTER_MISSION,
  HOME_HERO_SUMMARY,
  HOME_HERO_TITLE,
} from "@/lib/content/public-content";

export const revalidate = 60;

async function getHomeData() {
  if (!process.env.DATABASE_URL) {
    logger.warn("HomePage: DATABASE_URL is not set, rendering fallback data");
    return { latestNews: [] };
  }

  try {
    const latestNews = await db.query.news.findMany({
      where: eq(news.status, "published"),
      orderBy: [desc(news.publishedAt)],
      limit: 5,
      columns: { id: true, title: true, slug: true, category: true, publishedAt: true, excerpt: true },
      with: { coverImage: { columns: { url: true, altText: true } } },
    });

    return { latestNews };
  } catch (error) {
    logger.error("HomePage: failed to load data, rendering fallback", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { latestNews: [] };
  }
}

// Category labels for news badge
const CAT_LABELS: Record<string, string> = {
  news: "Новости",
  science: "Наука",
  events: "События",
  media: "Медиа",
};

// Gradient placeholders for news cards without photos
const NEWS_PLACEHOLDERS = [
  "from-[#1A3A6B] to-[#0D1C2E]",
  "from-[#0D4F8C] to-[#1A3A6B]",
  "from-[#2C5F8A] to-[#060E18]",
];

export default async function HomePage() {
  const { latestNews } = await getHomeData();

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
              {HOME_HERO_TITLE}
            </h1>

            <p className="mb-10 max-w-[58ch] text-[clamp(0.98rem,1.22vw,1.05rem)] leading-7 text-white/72">
              {HOME_HERO_SUMMARY}
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
            <div className="flex flex-col sm:flex-row border-t border-white/10">
              {[
                { value: "216", label: "Публикаций" },
                { value: "12", label: "Проектов в работе" },
                { value: "21", label: "Сотрудник" },
                { value: "20+", label: "Лет исследований" },
              ].map((s, i) => (
                <div key={s.label} className={`flex-1 py-6 px-8 ${i === 0 ? "pl-0" : "border-t sm:border-t-0 sm:border-l border-white/10"}`}>
                  <p className="text-[2.5rem] font-black text-white leading-none">{s.value}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/40">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Center description ────────────────────────────────────── */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
              <div className="rounded-[2rem] border border-[#DDE8F0] bg-[#F4F8FB] p-8 sm:p-10">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-[2px] w-6 bg-[#5CAFD6]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#5CAFD6]">О центре</span>
                </div>
                <h2 className="text-[clamp(1.9rem,3.4vw,2.7rem)] font-black leading-[1.05] text-[#0D1C2E]">
                  Научная координация для устойчивого развития Севера и Арктики
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-[#4B6075]">
                  {CENTER_DESCRIPTION_PARAGRAPHS.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <p className="font-medium text-[#1A3A6B]">{CENTER_MISSION}</p>
                </div>
                <div className="mt-8">
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.14em] text-[#1A3A6B] border-b border-[#1A3A6B]/30 pb-1 hover:border-[#1A3A6B]"
                  >
                    Подробнее о центре <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] min-h-[420px]">
                <Image
                  src="/uploads/anic-sev-siyan.png"
                  alt="Северное сияние — символ арктической науки"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
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
                            {CAT_LABELS[item.category] ?? item.category}
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

        {/* ── Quick links (dark band) ───────────────────────────────── */}
        <section className="bg-[#060E18] py-20 border-t-[3px] border-[#5CAFD6]">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/5">
              {[
                { icon: BookOpen, title: "Исследования и проекты", desc: "Актуальные научные работы и проектные инициативы Арктического научно-исследовательского центра.", href: "/research", cta: "Перейти" },
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
