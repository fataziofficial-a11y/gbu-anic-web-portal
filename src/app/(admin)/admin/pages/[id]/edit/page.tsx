import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/PageForm";

export const dynamic = "force-dynamic";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const [item, allPages] = await Promise.all([
    db.query.pages.findFirst({ where: eq(pages.id, id) }),
    db.query.pages.findMany({ columns: { id: true, title: true } }),
  ]);

  if (!item) notFound();

  return (
    <PageForm
      mode="edit"
      pages={allPages}
      initialData={{
        id: item.id,
        title: item.title,
        content: item.content as Record<string, unknown> | undefined,
        parentId: item.parentId,
        sortOrder: item.sortOrder ?? 0,
        template: item.template ?? "default",
        status: item.status ?? "draft",
        seoTitle: item.seoTitle ?? "",
        seoDescription: item.seoDescription ?? "",
        slug: item.slug,
      }}
    />
  );
}
