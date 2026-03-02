import { db } from "@/lib/db";
import { knowledgeItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { KnowledgeForm } from "@/components/admin/KnowledgeForm";

export const dynamic = "force-dynamic";

export default async function EditKnowledgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const [item, categories, departments] = await Promise.all([
    db.query.knowledgeItems.findFirst({ where: eq(knowledgeItems.id, id) }),
    db.query.kbCategories.findMany({ columns: { id: true, name: true } }),
    db.query.departments.findMany({ columns: { id: true, name: true } }),
  ]);

  if (!item) notFound();

  return (
    <KnowledgeForm
      mode="edit"
      categories={categories}
      departments={departments}
      initialData={{
        id: item.id,
        title: item.title,
        content: item.content as Record<string, unknown> | undefined,
        categoryId: item.categoryId,
        departmentId: item.departmentId,
        tags: item.tags ?? [],
        status: item.status ?? "draft",
        slug: item.slug,
      }}
    />
  );
}
