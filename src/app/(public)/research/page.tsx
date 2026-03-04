import { db } from "@/lib/db";
import { projects, publications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
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
  active: "text-[#00E5C0] border-[#00E5C0]/30",
  planned: "text-blue-400 border-blue-400/30",
  completed: "text-white/30 border-white/10",
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
      <section className="arctic-page-header py-20 relative overflow-hidden">
        <div className="arctic-grid-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#00E5C0]/50 text-xs font-bold tracking-[0.2em] uppercase mb-3">
            Наука
          </p>
          <h1 className="heading-display text-4xl lg:text-5xl mb-4">
            Исследования и проекты
          </h1>
          <p className="text-[#666666] text-lg max-w-2xl">
            Научные проекты и исследовательские программы Арктического НИЦ
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-px border border-white/5 bg-white/5">
          {[
            { label: "Активных", count: active.length, color: "text-[#00E5C0]", icon: TrendingUp },
            { label: "Планируется", count: planned.length, color: "text-blue-400", icon: Clock },
            { label: "Завершено", count: completed.length, color: "text-[#777777]", icon: CheckCircle2 },
          ].map((stat) => (
            <div key={stat.label} className="card-dark p-6 text-center">
              <p className={`text-3xl font-black ${stat.color}`}>{stat.count}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#777777] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        {allProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white/5 flex items-center justify-center mb-5">
              <FlaskConical className="h-8 w-8 text-white/20" />
            </div>
            <p className="text-white/40 text-lg font-bold uppercase tracking-wider">Проектов пока нет</p>
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
                  <h2 className="heading-display text-2xl mb-6">{group.title}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.items.map((project) => {
                      const status = project.status ?? "planned";
                      const StatusIcon = statusIcons[status] ?? Clock;
                      return (
                        <div key={project.id} className="card-dark p-6">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-white/5 flex items-center justify-center mt-0.5">
                                <FlaskConical className="h-5 w-5 text-[#00E5C0]/50" />
                              </div>
                              <div>
                                <h3 className="font-bold text-white leading-snug">
                                  {project.title}
                                </h3>
                                {project.department && (
                                  <p className="text-[10px] text-[#00E5C0]/40 mt-1 font-black uppercase tracking-wider">
                                    {project.department.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${statusColors[status]}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusLabel[status]}
                            </span>
                          </div>

                          {project.description && (
                            <p className="text-sm text-white/30 leading-relaxed mb-4 ml-14">
                              {project.description}
                            </p>
                          )}

                          {(project.startDate || project.endDate) && (
                            <div className="flex items-center gap-1.5 text-xs text-white/20 ml-14">
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
            <h2 className="heading-display text-2xl mb-6">Последние публикации</h2>
            <div className="space-y-2">
              {recentPubs.map((pub) => (
                <div key={pub.id} className="card-dark p-5 flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/5 flex items-center justify-center">
                    <BookMarked className="h-5 w-5 text-white/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white leading-snug">{pub.title}</p>
                    {pub.authors && (
                      <p className="text-sm text-white/30 mt-1">{pub.authors}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/20">
                      {pub.journal && <span>{pub.journal}</span>}
                      {pub.year && (
                        <span className="border border-white/10 px-2 py-0.5 font-bold">
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
                      className="flex-shrink-0 w-8 h-8 bg-white/5 flex items-center justify-center text-[#00E5C0]/50 hover:text-[#00E5C0] transition-colors"
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


