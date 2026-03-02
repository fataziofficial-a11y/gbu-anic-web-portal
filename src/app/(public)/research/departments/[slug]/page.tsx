import { db } from "@/lib/db";
import { departments, projects, publications, teamMembers } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Building2, FlaskConical, BookMarked, Users, Calendar, ExternalLink, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateStaticParams() {
  const depts = await db.query.departments.findMany({
    columns: { slug: true },
  });
  return depts.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dept = await db.query.departments.findFirst({
    where: eq(departments.slug, slug),
    columns: { name: true },
  });
  if (!dept) return { title: "Подразделение не найдено" };
  return { title: dept.name };
}

const statusLabel: Record<string, string> = {
  planned: "Планируется",
  active: "Активный",
  completed: "Завершён",
};
const statusColors: Record<string, string> = {
  active: "text-[#00E5C0] border-[#00E5C0]/30",
  planned: "text-blue-400 border-blue-400/30",
  completed: "text-white/30 border-white/10",
};
const statusIcons: Record<string, typeof TrendingUp> = {
  active: TrendingUp,
  planned: Clock,
  completed: CheckCircle2,
};

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const dept = await db.query.departments.findFirst({
    where: eq(departments.slug, slug),
    with: { head: { columns: { name: true, position: true, email: true } } },
  });

  if (!dept) notFound();

  const [deptTeam, deptProjects, deptPubs] = await Promise.all([
    db.query.teamMembers.findMany({
      where: eq(teamMembers.departmentId, dept.id),
      orderBy: [asc(teamMembers.sortOrder), asc(teamMembers.name)],
      with: { photo: { columns: { url: true } } },
    }),
    db.query.projects.findMany({
      where: eq(projects.departmentId, dept.id),
      orderBy: [desc(projects.createdAt)],
    }),
    db.query.publications.findMany({
      where: eq(publications.departmentId, dept.id),
      orderBy: [desc(publications.createdAt)],
      limit: 10,
    }),
  ]);

  const activeProjects = deptProjects.filter((p) => p.status === "active");
  const otherProjects = deptProjects.filter((p) => p.status !== "active");

  return (
    <div>
      {/* Шапка */}
      <section className="arctic-page-header text-white py-14 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-white/30 hover:text-[#00E5C0] text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Все подразделения
          </Link>
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-14 h-14 bg-white/5 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-[#00E5C0]/60" />
            </div>
            <div>
              <h1 className="heading-display text-3xl lg:text-4xl text-white">{dept.name}</h1>
              {dept.head && (
                <p className="text-white/40 mt-2">
                  Руководитель: {dept.head.name}
                  {dept.head.position && ` — ${dept.head.position}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Описание */}
        {dept.description && (
          <section className="card-dark p-8">
            <p className="text-white/40 leading-relaxed text-lg">{dept.description}</p>
          </section>
        )}

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-px border border-white/5 bg-white/5">
          {[
            { icon: Users, label: "Сотрудников", value: deptTeam.length, color: "text-[#00E5C0]" },
            { icon: FlaskConical, label: "Проектов", value: deptProjects.length, color: "text-blue-400" },
            { icon: BookMarked, label: "Публикаций", value: deptPubs.length, color: "text-white/50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#050E1C] p-6 text-center">
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Сотрудники */}
        {deptTeam.length > 0 && (
          <section>
            <h2 className="heading-display text-xl text-white mb-5 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#00E5C0]/50" />
              Сотрудники
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {deptTeam.map((member) => (
                <div key={member.id} className="card-dark p-4 text-center">
                  {member.photo ? (
                    <Image
                      src={member.photo.url}
                      alt={member.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover mx-auto mb-3 border border-[#00E5C0]/15"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white/5 border border-[#00E5C0]/20 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-black text-[#00E5C0]/50">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <p className="font-bold text-white text-sm leading-snug">{member.name}</p>
                  {member.position && (
                    <p className="text-xs text-white/25 mt-1 line-clamp-2">{member.position}</p>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-xs text-white/15 hover:text-[#00E5C0] mt-2 block transition-colors"
                    >
                      {member.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Активные проекты */}
        {activeProjects.length > 0 && (
          <section>
            <h2 className="heading-display text-xl text-white mb-5 flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-[#00E5C0]/50" />
              Активные проекты
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeProjects.map((project) => {
                const status = project.status ?? "active";
                const StatusIcon = statusIcons[status] ?? TrendingUp;
                return (
                  <div key={project.id} className="card-dark p-6 border-l-2 border-l-[#00E5C0]/40">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-white leading-snug">{project.title}</h3>
                      <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider border px-2 py-0.5 ${statusColors[status]}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusLabel[status]}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-white/30 leading-relaxed">{project.description}</p>
                    )}
                    {(project.startDate || project.endDate) && (
                      <div className="flex items-center gap-1.5 text-xs text-white/20 mt-3">
                        <Calendar className="h-3.5 w-3.5" />
                        {project.startDate ?? "?"} — {project.endDate ?? "н.в."}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Завершённые и планируемые */}
        {otherProjects.length > 0 && (
          <section>
            <h2 className="heading-display text-xl text-white mb-5">Другие проекты</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {otherProjects.map((project) => {
                const status = project.status ?? "planned";
                const StatusIcon = statusIcons[status] ?? Clock;
                return (
                  <div key={project.id} className="card-dark p-5 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white leading-snug">{project.title}</h3>
                      {project.description && (
                        <p className="text-sm text-white/30 mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider border px-2 py-0.5 ${statusColors[status]}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusLabel[status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Публикации */}
        {deptPubs.length > 0 && (
          <section>
            <h2 className="heading-display text-xl text-white mb-5 flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-white/20" />
              Публикации
            </h2>
            <div className="space-y-2">
              {deptPubs.map((pub) => (
                <div key={pub.id} className="card-dark p-5 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white leading-snug">{pub.title}</p>
                    {pub.authors && (
                      <p className="text-sm text-white/30 mt-1">{pub.authors}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/20">
                      {pub.journal && <span>{pub.journal}</span>}
                      {pub.year && (
                        <span className="border border-white/10 px-2 py-0.5 font-bold">{pub.year}</span>
                      )}
                    </div>
                  </div>
                  {pub.doi && (
                    <a
                      href={pub.doi.startsWith("http") ? pub.doi : `https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-8 h-8 bg-white/5 flex items-center justify-center text-[#00E5C0]/40 hover:text-[#00E5C0] transition-colors"
                      title="Открыть DOI"
                    >
                      <ExternalLink className="h-4 w-4" />
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
