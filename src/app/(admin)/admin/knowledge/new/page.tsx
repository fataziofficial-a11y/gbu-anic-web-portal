import { db } from "@/lib/db";
import { KnowledgeForm } from "@/components/admin/KnowledgeForm";

export const dynamic = "force-dynamic";

export default async function NewKnowledgePage() {
  const [categories, departments] = await Promise.all([
    db.query.kbCategories.findMany({ columns: { id: true, name: true } }),
    db.query.departments.findMany({ columns: { id: true, name: true } }),
  ]);

  return (
    <KnowledgeForm
      mode="create"
      categories={categories}
      departments={departments}
    />
  );
}
