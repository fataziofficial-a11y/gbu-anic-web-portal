import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { desc, eq, ilike, or, count, and, SQL } from "drizzle-orm";
import { formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Eye } from "lucide-react";
import { Calendar } from "lucide-react";
import { NewsStatusActions } from "@/components/admin/NewsStatusActions";

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  published: { label: "Опубликовано", variant: "default" },
  draft: { label: "Черновик", variant: "secondary" },
  archived: { label: "Архив", variant: "outline" },
};

const PAGE_SIZE = 15;

interface Props {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function NewsListPage({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const search = sp.search ?? "";
  const statusFilter = sp.status ?? "";

  const offset = (page - 1) * PAGE_SIZE;

  const conditions: SQL[] = [];
  if (statusFilter && ["draft", "published", "archived"].includes(statusFilter)) {
    conditions.push(eq(news.status, statusFilter));
  }
  if (search) {
    conditions.push(or(ilike(news.title, `%${search}%`))!);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db.query.news.findMany({
      where,
      orderBy: [desc(news.createdAt)],
      limit: PAGE_SIZE,
      offset,
      with: { author: true },
    }),
    db.select({ count: count() }).from(news).where(where),
  ]);

  const total = Number(totalResult[0].count);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Новости</h1>
          <p className="text-sm text-gray-500">Всего: {total}</p>
        </div>
        <Button asChild>
          <Link href="/admin/news/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить новость
          </Link>
        </Button>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "Все", value: "" },
          { label: "Опубликованные", value: "published" },
          { label: "Черновики", value: "draft" },
          { label: "Архив", value: "archived" },
        ].map((f) => (
          <Link
            key={f.value}
            href={`/admin/news?status=${f.value}${search ? `&search=${search}` : ""}`}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Таблица */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[100px] shrink-0">Дата</TableHead>
              <TableHead>Заголовок</TableHead>
              <TableHead className="w-[120px]">Статус</TableHead>
              <TableHead className="w-[130px]">Автор</TableHead>
              <TableHead className="w-[100px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-gray-400">
                  Новостей не найдено
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const statusInfo = STATUS_LABELS[item.status ?? "draft"];
                return (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-300 shrink-0" />
                        {new Date(item.createdAt ?? new Date()).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <div className="truncate">
                        <Link
                          href={`/admin/news/${item.id}/edit`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                          title={item.title}
                        >
                          {item.title}
                        </Link>
                      </div>
                      {item.category && (
                        <span className="text-xs text-gray-400">{item.category}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant} className="text-xs whitespace-nowrap">
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[130px] truncate" title={item.author?.name ?? ""}>
                      {item.author?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {item.status === "published" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a
                              href={`/news/${item.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Открыть на сайте"
                            >
                              <Eye className="h-4 w-4 text-gray-400" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/admin/news/${item.id}/edit`} title="Редактировать">
                            <Pencil className="h-4 w-4 text-gray-400" />
                          </Link>
                        </Button>
                        <NewsStatusActions
                          id={item.id}
                          status={item.status ?? "draft"}
                          userRole={session.user.role}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Страница {page} из {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/admin/news?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}${search ? `&search=${search}` : ""}`}
                >
                  ← Назад
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/admin/news?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}${search ? `&search=${search}` : ""}`}
                >
                  Вперёд →
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
