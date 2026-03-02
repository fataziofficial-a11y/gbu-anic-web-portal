import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NewsForm } from "@/components/admin/NewsForm";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const item = await db.query.news.findFirst({
    where: eq(news.id, parseInt(id)),
  });
  return { title: item ? `${item.title} — CMS АНИЦ` : "Редактировать новость" };
}

export default async function EditNewsPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const newsId = parseInt(id);
  if (isNaN(newsId)) notFound();

  const item = await db.query.news.findFirst({
    where: eq(news.id, newsId),
    with: { coverImage: true },
  });
  if (!item) notFound();

  return (
    <NewsForm
      mode="edit"
      initialData={{
        id: item.id,
        title: item.title,
        content: item.content as Record<string, unknown> | undefined,
        excerpt: item.excerpt ?? undefined,
        category: item.category ?? undefined,
        tags: item.tags ?? [],
        status: item.status ?? "draft",
        seoTitle: item.seoTitle ?? undefined,
        seoDescription: item.seoDescription ?? undefined,
        slug: item.slug,
        coverImageId: item.coverImageId ?? null,
        coverImage: item.coverImage ? { id: item.coverImage.id, url: item.coverImage.url } : null,
      }}
    />
  );
}
