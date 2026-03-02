import { db } from "@/lib/db";
import { projects, publications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Calendar, BookMarked, ExternalLink, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Исследования" };
export const revalidate = 300;

const statusLabel: Record<string, string> = {
  planned: "Планируется",
  active: "Активный",
  completed: "Завершён",
};
const statusColors: Record<string, string> = {
  active: "bg-aurora-teal/10 text-aurora-teal border-aurora-teal/20",
  planned: "bg-glacial/10 text-glacial border-glacial/20",
  completed: "bg-slate-100 text-slate-500 border-slate-200",
};
const statusIcons: Record<string, typeof TrendingUp> = {
  active: TrendingUp,
  planned: Clock,
  completed: CheckCircle2,
};

export default async function ResearchPage() {
  const [allProjects, recentPubs] = await Promise.all([
    db.query.projects.findMany({
      orderBy: [desc(projects.createdAt)],
      with: { department: { columns: { name: true } } },
    }),
    db.query.publications.findMany({
      orderBy: [desc(publications.createdAt)],
      with: { department: { columns: { name: true } } },
      limit: 10,
    }),
  ]);

  const active = allProjects.filter((p) => p.status === "active");
  const planned = allProjects.filter((p) => p.status === "planned");
  const completed = allProjects.filter((p) => p.status === "completed");

  return (
    <div>
      <section className="arctic-page-header text-white py-20 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-glacial-light/50 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Наука
          </p>
          <h1 className="heading-serif text-4xl lg:text-5xl text-white mb-4">
            Исследования и проекты
          </h1>
          <p className="text-slate-300/70 text-lg max-w-2xl">
            Научные проекты и исследовательские программы Арктического НИЦ
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-5">
          {[
            { label: "Активных", count: active.length, color: "text-aurora-teal", icon: TrendingUp, bg: "bg-aurora-teal/8" },
            { label: "Планируется", count: planned.length, color: "text-glacial", icon: Clock, bg: "bg-glacial/8" },
            { label: "Завершено", count: completed.length, color: "text-slate-500", icon: CheckCircle2, bg: "bg-slate-100" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center card-hover">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.bg} mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className={`text-3xl font-bold font-serif ${stat.color}`}>{stat.count}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        {allProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <FlaskConical className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-lg">Проектов пока нет</p>
          </div>
        ) : (
          <>
            {[
              { title: "Активные проекты", items: active },
              { title: "Планируемые проекты", items: planned },
              { title: "Завершённые проекты", items: completed },
            ]
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <section key={group.title}>
                  <h2 className="heading-serif text-2xl text-arctic-900 mb-6">{group.title}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {group.items.map((project) => {
                      const status = project.status ?? "planned";
                      const StatusIcon = statusIcons[status] ?? Clock;
                      return (
                        <div
                          key={project.id}
                          className="bg-white rounded-2xl border border-slate-200/80 p-6 card-hover accent-border-hover"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-glacial/8 flex items-center justify-center mt-0.5">
                                <FlaskConical className="h-5 w-5 text-glacial" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-arctic-900 leading-snug">
                                  {project.title}
                                </h3>
                                {project.department && (
                                  <p className="text-[10px] text-slate-500 mt-1 font-medium uppercase tracking-wider">
                                    {project.department.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border ${statusColors[status]}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusLabel[status]}
                            </span>
                          </div>

                          {project.description && (
                            <p className="text-sm text-slate-500 leading-relaxed mb-4 ml-14">
                              {project.description}
                            </p>
                          )}

                          {(project.startDate || project.endDate) && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-14">
                              <Calendar className="h-3.5 w-3.5" />
                              {project.startDate ?? "?"} — {project.endDate ?? "н.в."}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
          </>
        )}

        {/* Publications */}
        {recentPubs.length > 0 && (
          <section>
            <h2 className="heading-serif text-2xl text-arctic-900 mb-6">Последние публикации</h2>
            <div className="space-y-3">
              {recentPubs.map((pub) => (
                <div
                  key={pub.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-start gap-4 card-hover accent-border-hover"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-glacial/8 flex items-center justify-center">
                    <BookMarked className="h-5 w-5 text-glacial" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-arctic-900 leading-snug">{pub.title}</p>
                    {pub.authors && (
                      <p className="text-sm text-slate-500 mt-1">{pub.authors}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                      {pub.journal && <span>{pub.journal}</span>}
                      {pub.year && (
                        <span className="bg-frost-50 px-2 py-0.5 rounded-md border border-slate-100">
                          {pub.year}
                        </span>
                      )}
                      {pub.department && <span>{pub.department.name}</span>}
                    </div>
                  </div>
                  {pub.doi && (
                    <a
                      href={pub.doi.startsWith("http") ? pub.doi : `https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-8 h-8 rounded-lg bg-glacial/8 flex items-center justify-center text-glacial hover:bg-glacial/15 transition-colors"
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
