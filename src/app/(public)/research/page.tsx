import { db } from "@/lib/db";
import { projects, publications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { FlaskConical, Calendar, BookMarked, ExternalLink, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { PageBanner } from "@/components/public/PageBanner";

export const metadata: Metadata = { title: "Исследования" };
export const revalidate = 300;

const statusLabel: Record<string, string> = {
  planned: "Планируется",
  active: "Активный",
  completed: "Завершён",
};

const statusColors: Record<string, string> = {
  active: "text-[#1A7A5A] bg-[#E8F5F0] border-[#B8DDD1]",
  planned: "text-[#1A3A6B] bg-[#EEF4FB] border-[#C0D5EE]",
  completed: "text-[#4B6075] bg-[#F0F4F8] border-[#DDE8F0]",
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
      <PageBanner
        eyebrow="Наука"
        title="Исследования и проекты"
        description="Научные проекты и исследовательские программы Арктического НИЦ"
      />

      <div className="mx-auto max-w-[1240px] space-y-14 px-4 py-14 sm:px-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Активных", count: active.length, icon: TrendingUp, color: "text-[#1A7A5A]", bg: "bg-[#E8F5F0]" },
            { label: "Планируется", count: planned.length, icon: Clock, color: "text-[#1A3A6B]", bg: "bg-[#EEF4FB]" },
            { label: "Завершено", count: completed.length, icon: CheckCircle2, color: "text-[#4B6075]", bg: "bg-[#F0F4F8]" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[#DDE8F0] bg-white p-6 text-center">
              <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.count}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#8B9BAD]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        {allProjects.length === 0 ? (
          <>
            <section>
              <h2 className="mb-6 text-2xl font-black text-[#0D1C2E]">Активные проекты</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-dashed border-[#DDE8F0] bg-[#FAFCFE] p-6">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B]/30">
                          <FlaskConical className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="h-4 w-48 rounded bg-[#DDE8F0]" />
                          <div className="mt-2 h-3 w-32 rounded bg-[#EEF4FB]" />
                        </div>
                      </div>
                      <div className="h-6 w-20 shrink-0 rounded-full bg-[#EEF4FB]" />
                    </div>
                    <div className="ml-14 space-y-1.5">
                      <div className="h-3 w-full rounded bg-[#EEF4FB]" />
                      <div className="h-3 w-5/6 rounded bg-[#EEF4FB]" />
                      <div className="h-3 w-3/4 rounded bg-[#EEF4FB]" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
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
                  <h2 className="mb-6 text-2xl font-black text-[#0D1C2E]">{group.title}</h2>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-0 md:grid-cols-2">
                    {group.items.map((project) => {
                      const status = project.status ?? "planned";
                      const StatusIcon = statusIcons[status] ?? Clock;
                      return (
                        <div key={project.id} className="row-span-4 mb-4 grid [grid-template-rows:subgrid] rounded-2xl border border-[#DDE8F0] bg-white">
                          {/* Строка 1: иконка + заголовок + статус */}
                          <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-0">
                            <div className="flex items-start gap-4">
                              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B]">
                                <FlaskConical className="h-5 w-5" />
                              </div>
                              <h3 className="font-bold leading-snug text-[#0D1C2E]">{project.title}</h3>
                            </div>
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColors[status]}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusLabel[status]}
                            </span>
                          </div>

                          {/* Строка 2: подразделение */}
                          <div className="px-6 pt-2 pb-0 pl-[calc(1.5rem+2.5rem+1rem)]">
                            {project.department && (
                              <p className="text-xs font-bold uppercase tracking-wider text-[#5CAFD6]">
                                {project.department.name}
                              </p>
                            )}
                          </div>

                          {/* Строка 3: описание */}
                          <div className="px-6 pt-3 pb-0">
                            {project.description && (
                              <p className="text-sm leading-relaxed text-[#4B6075]">
                                {project.description}
                              </p>
                            )}
                          </div>

                          {/* Строка 4: даты */}
                          <div className="px-6 pt-3 pb-6">
                            {(project.startDate || project.endDate) && (
                              <div className="flex items-center gap-1.5 text-xs text-[#8B9BAD]">
                                <Calendar className="h-3.5 w-3.5" />
                                {project.startDate ?? "?"} — {project.endDate ?? "н.в."}
                              </div>
                            )}
                          </div>
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
            <h2 className="mb-6 text-2xl font-black text-[#0D1C2E]">Последние публикации</h2>
            <div className="space-y-2">
              {recentPubs.map((pub) => (
                <div key={pub.id} className="flex items-start gap-4 rounded-2xl border border-[#DDE8F0] bg-white p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B]">
                    <BookMarked className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-snug text-[#0D1C2E]">{pub.title}</p>
                    {pub.authors && (
                      <p className="mt-1 text-sm text-[#4B6075]">{pub.authors}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#8B9BAD]">
                      {pub.journal && <span>{pub.journal}</span>}
                      {pub.year && (
                        <span className="rounded border border-[#DDE8F0] px-2 py-0.5 font-bold">{pub.year}</span>
                      )}
                      {pub.department && <span>{pub.department.name}</span>}
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
