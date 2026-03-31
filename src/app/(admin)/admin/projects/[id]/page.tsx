import { db } from "@/lib/db";
import { projects, projectRubrics, news } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, ArrowLeft, Newspaper } from "lucide-react";
import { ProjectRubricsManager } from "@/components/admin/ProjectRubricsManager";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  planned: "Планируется",
  active: "Активный",
  completed: "Завершён",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const [project, rubrics, recentNews] = await Promise.all([
    db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: { department: { columns: { name: true } } },
    }),
    db.query.projectRubrics.findMany({
      where: eq(projectRubrics.projectId, id),
      orderBy: [projectRubrics.sortOrder, projectRubrics.name],
    }),
    db.query.news.findMany({
      where: eq(news.projectId, id),
      orderBy: [desc(news.createdAt)],
      limit: 5,
      columns: { id: true, title: true, status: true, publishedAt: true, rubricId: true },
    }),
  ]);

  if (!project) notFound();

  return (
    <div className="p-6 space-y-6">
      {/* Хлебные крошки + заголовок */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Проекты
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <Badge variant={project.status === "active" ? "default" : "secondary"}>
              {statusLabel[project.status ?? "planned"]}
            </Badge>
            {project.department && (
              <span className="text-sm text-gray-500">{project.department.name}</span>
            )}
            {(project.startDate || project.endDate) && (
              <span className="text-sm text-gray-400">
                {project.startDate ?? "?"} — {project.endDate ?? "н.в."}
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-2 text-sm text-gray-600 max-w-2xl">{project.description}</p>
          )}
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/projects/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Редактировать
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Рубрики */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Рубрики проекта</h2>
          <ProjectRubricsManager projectId={id} initialRubrics={rubrics} />
        </div>

        {/* Последние новости */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Последние новости</h2>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/news/new?projectId=${id}`}>
                <Newspaper className="mr-2 h-3.5 w-3.5" />
                Новость
              </Link>
            </Button>
          </div>
          {recentNews.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
              <p className="text-sm text-gray-400">Новостей ещё нет</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
              {recentNews.map((item) => {
                const rubric = rubrics.find((r) => r.id === item.rubricId);
                return (
                  <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/news/${item.id}/edit`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                      >
                        {item.title}
                      </Link>
                      {rubric && (
                        <span className="text-xs text-[#5CAFD6]">{rubric.name}</span>
                      )}
                    </div>
                    <Badge
                      variant={item.status === "published" ? "default" : "secondary"}
                      className="shrink-0 text-xs"
                    >
                      {item.status === "published" ? "Опубл." : "Черновик"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
          {recentNews.length === 5 && (
            <Link
              href={`/admin/news?projectId=${id}`}
              className="mt-2 text-xs text-blue-600 hover:underline block"
            >
              Все новости проекта →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
