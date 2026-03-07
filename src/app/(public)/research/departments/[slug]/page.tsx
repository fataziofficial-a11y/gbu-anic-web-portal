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
  const depts = await db.query.departments.findMany({ columns: { slug: true } });
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

const statusLabel: Record<string, string> = { planned: "Планируется", active: "Активный", completed: "Завершён" };
const statusColors: Record<string, string> = {
  active: "text-[#1A7A5A] bg-[#E8F5F0] border-[#B8DDD1]",
  planned: "text-[#1A3A6B] bg-[#EEF4FB] border-[#C0D5EE]",
  completed: "text-[#4B6075] bg-[#F0F4F8] border-[#DDE8F0]",
};
const statusIcons: Record<string, typeof TrendingUp> = { active: TrendingUp, planned: Clock, completed: CheckCircle2 };

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
      <section className="border-b border-[#DDE8F0] bg-[#F7FAFD] py-14">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <Link
            href="/about"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A3A6B] transition hover:text-[#5CAFD6]"
          >
            <ArrowLeft className="h-4 w-4" />
            Все подразделения
          </Link>
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#1A3A6B]">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#0D1C2E] lg:text-4xl">{dept.name}</h1>
              {dept.head && (
                <p className="mt-2 text-[#4B6075]">
                  Руководитель: <span className="font-semibold">{dept.head.name}</span>
                  {dept.head.position && ` — ${dept.head.position}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] space-y-10 px-4 py-12 sm:px-6">
        {dept.description && (
          <section className="rounded-2xl border border-[#DDE8F0] bg-white p-8">
            <p className="text-lg leading-relaxed text-[#4B6075]">{dept.description}</p>
          </section>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Users, label: "Сотрудников", value: deptTeam.length, color: "text-[#5CAFD6]", bg: "bg-[#EEF4FB]" },
            { icon: FlaskConical, label: "Проектов", value: deptProjects.length, color: "text-[#1A3A6B]", bg: "bg-[#EEF4FB]" },
            { icon: BookMarked, label: "Публикаций", value: deptPubs.length, color: "text-[#4B6075]", bg: "bg-[#F0F4F8]" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[#DDE8F0] bg-white p-6 text-center">
              <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#8B9BAD]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        {deptTeam.length > 0 && (
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-[#0D1C2E]">
              <Users className="h-5 w-5 text-[#5CAFD6]" />
              Сотрудники
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {deptTeam.map((member) => (
                <div key={member.id} className="rounded-2xl border border-[#DDE8F0] bg-white p-4 text-center">
                  {member.photo ? (
                    <Image
                      src={member.photo.url}
                      alt={member.name}
                      width={64}
                      height={64}
                      className="mx-auto mb-3 h-16 w-16 rounded-full object-cover ring-2 ring-[#DDE8F0]"
                    />
                  ) : (
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF4FB]">
                      <span className="text-xl font-black text-[#1A3A6B]">{member.name.charAt(0)}</span>
                    </div>
                  )}
                  <p className="text-sm font-bold leading-snug text-[#0D1C2E]">{member.name}</p>
                  {member.position && (
                    <p className="mt-1 line-clamp-2 text-xs text-[#4B6075]">{member.position}</p>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="mt-2 block text-xs text-[#8B9BAD] transition hover:text-[#1A3A6B]"
                    >
                      {member.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active projects */}
        {activeProjects.length > 0 && (
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-[#0D1C2E]">
              <FlaskConical className="h-5 w-5 text-[#5CAFD6]" />
              Активные проекты
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {activeProjects.map((project) => {
                const status = project.status ?? "active";
                const StatusIcon = statusIcons[status] ?? TrendingUp;
                return (
                  <div key={project.id} className="rounded-2xl border border-l-4 border-[#DDE8F0] border-l-[#5CAFD6] bg-white p-6">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="font-bold leading-snug text-[#0D1C2E]">{project.title}</h3>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColors[status]}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusLabel[status]}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm leading-relaxed text-[#4B6075]">{project.description}</p>
                    )}
                    {(project.startDate || project.endDate) && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#8B9BAD]">
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

        {/* Other projects */}
        {otherProjects.length > 0 && (
          <section>
            <h2 className="mb-5 text-xl font-black text-[#0D1C2E]">Другие проекты</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {otherProjects.map((project) => {
                const status = project.status ?? "planned";
                const StatusIcon = statusIcons[status] ?? Clock;
                return (
                  <div key={project.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[#DDE8F0] bg-white p-5">
                    <div>
                      <h3 className="font-bold leading-snug text-[#0D1C2E]">{project.title}</h3>
                      {project.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-[#4B6075]">{project.description}</p>
                      )}
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColors[status]}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusLabel[status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Publications */}
        {deptPubs.length > 0 && (
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-[#0D1C2E]">
              <BookMarked className="h-5 w-5 text-[#5CAFD6]" />
              Публикации
            </h2>
            <div className="space-y-2">
              {deptPubs.map((pub) => (
                <div key={pub.id} className="flex items-start gap-4 rounded-2xl border border-[#DDE8F0] bg-white p-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-snug text-[#0D1C2E]">{pub.title}</p>
                    {pub.authors && <p className="mt-1 text-sm text-[#4B6075]">{pub.authors}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#8B9BAD]">
                      {pub.journal && <span>{pub.journal}</span>}
                      {pub.year && (
                        <span className="rounded border border-[#DDE8F0] px-2 py-0.5 font-bold">{pub.year}</span>
                      )}
                    </div>
                  </div>
                  {pub.doi && (
                    <a
                      href={pub.doi.startsWith("http") ? pub.doi : `https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#DDE8F0] text-[#4B6075] transition hover:border-[#1A3A6B] hover:text-[#1A3A6B]"
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
