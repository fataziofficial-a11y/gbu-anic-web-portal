import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { news, pages, knowledgeItems, teamMembers, files } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Newspaper,
  FileText,
  BookOpen,
  Users,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";

async function getStats() {
  const [
    newsTotal,
    newsPublished,
    newsDraft,
    pagesTotal,
    kbTotal,
    teamTotal,
    filesTotal,
  ] = await Promise.all([
    db.select({ count: count() }).from(news),
    db.select({ count: count() }).from(news).where(eq(news.status, "published")),
    db.select({ count: count() }).from(news).where(eq(news.status, "draft")),
    db.select({ count: count() }).from(pages),
    db.select({ count: count() }).from(knowledgeItems),
    db.select({ count: count() }).from(teamMembers),
    db.select({ count: count() }).from(files),
  ]);

  return {
    news: { total: newsTotal[0].count, published: newsPublished[0].count, draft: newsDraft[0].count },
    pages: pagesTotal[0].count,
    kb: kbTotal[0].count,
    team: teamTotal[0].count,
    files: filesTotal[0].count,
  };
}

async function getRecentNews() {
  return db.query.news.findMany({
    orderBy: [desc(news.createdAt)],
    limit: 5,
    with: { author: true },
  });
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  published: { label: "Опубликовано", variant: "default" },
  draft: { label: "Черновик", variant: "secondary" },
  archived: { label: "Архив", variant: "outline" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [stats, recentNews] = await Promise.all([getStats(), getRecentNews()]);

  const statCards = [
    {
      title: "Новости",
      value: stats.news.total,
      sub: `${stats.news.published} опубл. · ${stats.news.draft} черн.`,
      icon: Newspaper,
      href: "/admin/news",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Страницы",
      value: stats.pages,
      sub: "статических страниц",
      icon: FileText,
      href: "/admin/pages",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "База знаний",
      value: stats.kb,
      sub: "материалов",
      icon: BookOpen,
      href: "/admin/knowledge",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Сотрудники",
      value: stats.team,
      sub: "в команде",
      icon: Users,
      href: "/admin/team",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Добро пожаловать, {session.user.name}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/news/new">
            <Plus className="mr-2 h-4 w-4" />
            Новая новость
          </Link>
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="transition-shadow hover:shadow-md cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {String(card.value)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                  </div>
                  <div className={`rounded-lg p-2 ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Быстрые действия + последние новости */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Последние новости */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Последние новости
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/news" className="text-xs text-blue-600">
                Все новости →
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentNews.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                Новостей пока нет
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentNews.map((item) => {
                  const statusInfo = STATUS_LABELS[item.status ?? "draft"];
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/admin/news/${item.id}/edit`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">
                            {item.author?.name ?? "—"}
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400">
                            {formatDate(item.createdAt ?? new Date())}
                          </span>
                        </div>
                      </div>
                      <Badge variant={statusInfo.variant} className="shrink-0 text-xs">
                        {statusInfo.label}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Быстрые действия */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Быстрые действия
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Написать новость", href: "/admin/news/new", icon: Newspaper },
              { label: "Добавить закупку", href: "/admin/procurements/new", icon: FileText },
              { label: "Добавить в базу знаний", href: "/admin/knowledge/new", icon: BookOpen },
              { label: "Добавить сотрудника", href: "/admin/team/new", icon: Users },
            ].map((action) => (
              <Button
                key={action.href}
                variant="outline"
                className="w-full justify-start text-sm"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="mr-2 h-4 w-4 text-gray-400" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Подсказка */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Следующий шаг</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Заполните базу данных тестовыми данными:{" "}
            <code className="rounded bg-blue-100 px-1 py-0.5 text-xs font-mono">
              pnpm db:seed
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
