import { db } from "@/lib/db";
import { departments, projects, publications, teamMembers } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, FlaskConical, BookMarked, Users, Calendar, ExternalLink } from "lucide-react";
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
const statusColor: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  planned: "secondary",
  completed: "outline",
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
      <section className="bg-gradient-to-br from-blue-800 to-blue-900 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Все подразделения
          </Link>
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold">{dept.name}</h1>
              {dept.head && (
                <p className="text-blue-200 mt-2">
                  Руководитель: {dept.head.name}
                  {dept.head.position && ` — ${dept.head.position}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Описание */}
        {dept.description && (
          <section className="bg-white rounded-xl border border-gray-200 p-8">
            <p className="text-gray-600 leading-relaxed text-lg">{dept.description}</p>
          </section>
        )}

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: Users, label: "Сотрудников", value: deptTeam.length, color: "text-blue-600" },
            { icon: FlaskConical, label: "Проектов", value: deptProjects.length, color: "text-green-600" },
            { icon: BookMarked, label: "Публикаций", value: deptPubs.length, color: "text-purple-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Сотрудники */}
        {deptTeam.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Сотрудники
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {deptTeam.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-center"
                >
                  {member.photo ? (
                    <Image
                      src={member.photo.url}
                      alt={member.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-blue-600">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <p className="font-medium text-gray-900 text-sm leading-snug">{member.name}</p>
                  {member.position && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{member.position}</p>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-xs text-gray-400 hover:text-blue-600 mt-2 block"
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
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-green-600" />
              Активные проекты
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 border-l-4 border-l-green-500"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 leading-snug">{project.title}</h3>
                    <Badge variant={statusColor[project.status ?? "active"]}>
                      {statusLabel[project.status ?? "active"]}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-500 leading-relaxed">{project.description}</p>
                  )}
                  {(project.startDate || project.endDate) && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
                      <Calendar className="h-3.5 w-3.5" />
                      {project.startDate ?? "?"} — {project.endDate ?? "н.в."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Завершённые и планируемые */}
        {otherProjects.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-5">Другие проекты</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-3"
                >
                  <div>
                    <h3 className="font-medium text-gray-900 leading-snug">{project.title}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <Badge variant={statusColor[project.status ?? "planned"]} className="flex-shrink-0">
                    {statusLabel[project.status ?? "planned"]}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Публикации */}
        {deptPubs.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-purple-600" />
              Публикации
            </h2>
            <div className="space-y-3">
              {deptPubs.map((pub) => (
                <div
                  key={pub.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 leading-snug">{pub.title}</p>
                    {pub.authors && (
                      <p className="text-sm text-gray-500 mt-1">{pub.authors}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                      {pub.journal && <span>{pub.journal}</span>}
                      {pub.year && <span>{pub.year}</span>}
                    </div>
                  </div>
                  {pub.doi && (
                    <a
                      href={pub.doi.startsWith("http") ? pub.doi : `https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-blue-500 hover:text-blue-700"
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
