import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, FlaskConical, FolderKanban, Users, Building2, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    columns: { title: true, description: true },
  });
  if (!project) return { title: "Не найдено" };
  return { title: project.title, description: project.description ?? undefined };
}

const TYPE_LABELS: Record<string, string> = {
  actual_work: "Актуальная работа",
  editorial_project: "Проектная инициатива",
  project: "Проект",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  actual_work: FlaskConical,
  editorial_project: FolderKanban,
  project: Building2,
};

export default async function ResearchDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });

  if (!project) notFound();

  const type = project.type ?? "project";
  const TypeIcon = TYPE_ICONS[type] ?? FlaskConical;
  const typeLabel = TYPE_LABELS[type] ?? type;
  const partnersList = (project.partnersList as string[] | null) ?? [];

  return (
    <div>
      {/* Banner */}
      <section className="relative bg-[#060E18] border-b-[3px] border-[#5CAFD6] py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#060E18] via-[#060E18]/90 to-[#060E18]/60" />
        <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] text-white/40 mb-6">
            <Link href="/" className="hover:text-white/70 transition-colors">Главная</Link>
            <span>/</span>
            <Link href="/research" className="hover:text-white/70 transition-colors">Исследования и проекты</Link>
            <span>/</span>
            <span className="text-white/60 line-clamp-1">{project.title}</span>
          </nav>

          {/* Type badge */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-[2px] w-6 bg-[#5CAFD6]" />
            <span className="text-[#5CAFD6] text-[11px] font-black uppercase tracking-[0.22em]">
              {typeLabel}
            </span>
          </div>

          <h1 className="text-[clamp(1.6rem,3.5vw,3rem)] font-black text-white leading-[1.1] max-w-[38ch]">
            {project.title}
          </h1>

          {project.duration && (
            <div className="mt-5 flex items-center gap-2 text-[#5CAFD6] text-sm font-bold">
              <Calendar className="h-4 w-4" />
              {project.duration}
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          {/* Main */}
          <div className="space-y-8">
            {/* Icon */}
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#1A3A6B]">
              <TypeIcon className="h-7 w-7" />
            </div>

            {project.description && (
              <div>
                <h2 className="text-lg font-black text-[#0D1C2E] mb-3">Описание</h2>
                <p className="text-base leading-relaxed text-[#4B6075]">{project.description}</p>
              </div>
            )}

            {project.lead && (
              <div className="rounded-2xl border border-[#DDE8F0] bg-white p-6">
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#5CAFD6] mb-2">
                  Руководитель
                </p>
                <p className="text-base text-[#0D1C2E]">{project.lead}</p>
              </div>
            )}

            {project.consultant && (
              <div className="rounded-2xl border border-[#DDE8F0] bg-white p-6">
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#5CAFD6] mb-2">
                  Консультант
                </p>
                <p className="text-base text-[#0D1C2E]">{project.consultant}</p>
              </div>
            )}

            {project.partnerOrg && (
              <div className="rounded-2xl border border-[#DDE8F0] bg-white p-6">
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#5CAFD6] mb-2">
                  Индустриальный партнёр
                </p>
                <p className="text-base text-[#0D1C2E]">{project.partnerOrg}</p>
              </div>
            )}

            {partnersList.length > 0 && (
              <div className="rounded-2xl border border-[#DDE8F0] bg-white p-6">
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#5CAFD6] mb-3">
                  {partnersList.length > 1 ? "Партнёры" : "Партнёр"}
                </p>
                <ul className="space-y-2">
                  {partnersList.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-base text-[#0D1C2E]">
                      <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#5CAFD6]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="rounded-2xl border border-[#DDE8F0] bg-[#F4F8FB] p-6 space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8B9BAD]">
                Информация
              </p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[#8B9BAD] text-xs mb-0.5">Тип</p>
                  <p className="font-medium text-[#0D1C2E]">{typeLabel}</p>
                </div>
                {project.duration && (
                  <div>
                    <p className="text-[#8B9BAD] text-xs mb-0.5">Сроки</p>
                    <p className="font-medium text-[#0D1C2E]">{project.duration}</p>
                  </div>
                )}
                {project.status && (
                  <div>
                    <p className="text-[#8B9BAD] text-xs mb-0.5">Статус</p>
                    <p className="font-medium text-[#0D1C2E]">
                      {project.status === "active" ? "Активный" : project.status === "completed" ? "Завершён" : "Планируется"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/research"
              className="flex items-center gap-2 text-sm font-bold text-[#1A3A6B] hover:text-[#5CAFD6] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Все исследования и проекты
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
