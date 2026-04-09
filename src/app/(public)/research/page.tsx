import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, FlaskConical, FolderKanban, Microscope, Users } from "lucide-react";
import { PageBanner } from "@/components/public/PageBanner";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const metadata: Metadata = { title: "Исследования" };
export const revalidate = 300;

export default async function ResearchPage() {
  const allProjects = await db.query.projects.findMany({
    orderBy: [asc(projects.createdAt)],
  });

  const actualWorks = allProjects.filter((p) => p.type === "actual_work");
  const editorialProjects = allProjects.filter((p) => p.type === "editorial_project");

  return (
    <div>
      <PageBanner
        eyebrow="Наука"
        title="Исследования и проекты"
        description="Витрина актуальных научных работ и проектных инициатив Арктического научно-исследовательского центра Республики Саха (Якутия)"
      />

      <div className="mx-auto max-w-[1240px] space-y-16 px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: "Актуальных работ", count: String(actualWorks.length || 5), icon: Microscope, color: "text-[#1A3A6B]", bg: "bg-[#EEF4FB]" },
            { label: "Проектов", count: String(editorialProjects.length || 12), icon: FolderKanban, color: "text-[#1A7A5A]", bg: "bg-[#E8F5F0]" },
            { label: "Ключевой фокус", count: "Арктика", icon: Users, color: "text-[#8F5D24]", bg: "bg-[#F8F0E5]" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-[#DDE8F0] bg-white p-6 text-center">
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.count}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#8B9BAD]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Актуальные работы */}
        <section>
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-[2px] w-6 bg-[#5CAFD6]" />
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#5CAFD6]">Актуальное</span>
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.75rem)] font-black leading-[1.05] text-[#0D1C2E]">
              {actualWorks.length} актуальных {actualWorks.length === 1 ? "работа" : "работ"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-0 lg:grid-cols-2">
            {actualWorks.map((work) => (
              <Link
                key={work.id}
                href={`/research/${work.slug}`}
                className="row-span-5 mb-4 grid [grid-template-rows:subgrid] rounded-3xl border border-[#DDE8F0] bg-white hover:border-[#5CAFD6]/40 transition-colors"
              >
                <div className="px-6 pt-6 pb-0">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#1A3A6B]">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black leading-snug text-[#0D1C2E]">{work.title}</h3>
                </div>
                <div className="px-6 pt-3 pb-0">
                  {work.lead ? <p className="text-sm leading-relaxed text-[#1A3A6B]">{work.lead}</p> : <div />}
                </div>
                <div className="px-6 pt-3 pb-0">
                  {work.consultant ? <p className="text-sm leading-relaxed text-[#4B6075]">{work.consultant}</p> : <div />}
                </div>
                <div className="px-6 pt-3 pb-0">
                  {work.partnerOrg ? <p className="text-sm leading-relaxed text-[#4B6075]">{work.partnerOrg}</p> : <div />}
                </div>
                <div className="px-6 pt-3 pb-6">
                  {work.duration && (
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#5CAFD6]">
                      <Calendar className="h-3.5 w-3.5" />
                      {work.duration}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Проектные инициативы */}
        <section>
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-[2px] w-6 bg-[#5CAFD6]" />
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#5CAFD6]">Проекты</span>
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.75rem)] font-black leading-[1.05] text-[#0D1C2E]">
              {editorialProjects.length} {editorialProjects.length === 1 ? "проект" : editorialProjects.length < 5 ? "проекта" : "проектов"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-0 lg:grid-cols-2">
            {editorialProjects.map((project) => {
              const partnersList = (project.partnersList as string[] | null) ?? [];
              return (
                <Link
                  key={project.id}
                  href={`/research/${project.slug}`}
                  className="row-span-4 mb-4 grid [grid-template-rows:subgrid] rounded-3xl border border-[#DDE8F0] bg-white hover:border-[#5CAFD6]/40 transition-colors"
                >
                  <div className="px-6 pt-6 pb-0">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#1A3A6B]">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-black leading-snug text-[#0D1C2E]">{project.title}</h3>
                  </div>
                  <div className="px-6 pt-3 pb-0">
                    {project.duration ? (
                      <div className="flex items-center gap-2 text-sm font-medium leading-relaxed text-[#1A3A6B]">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>{project.duration}</span>
                      </div>
                    ) : <div />}
                  </div>
                  <div className="px-6 pt-3 pb-0">
                    {project.lead ? <p className="text-sm leading-relaxed text-[#4B6075]">{project.lead}</p> : <div />}
                  </div>
                  <div className="px-6 pt-3 pb-6">
                    {partnersList.length > 0 ? (
                      <div className="space-y-1.5 text-sm leading-relaxed text-[#4B6075]">
                        <p className="font-medium text-[#0D1C2E]">{partnersList.length > 1 ? "Партнеры" : "Партнер"}</p>
                        {partnersList.map((partner) => (
                          <p key={partner}>{partner}</p>
                        ))}
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
