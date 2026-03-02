import { db } from "@/lib/db";
import { publications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PublicationForm } from "@/components/admin/PublicationForm";

export const dynamic = "force-dynamic";

export default async function EditPublicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const [item, departments] = await Promise.all([
    db.query.publications.findFirst({ where: eq(publications.id, id) }),
    db.query.departments.findMany({ columns: { id: true, name: true } }),
  ]);

  if (!item) notFound();

  return (
    <PublicationForm
      mode="edit"
      departments={departments}
      initialData={{
        id: item.id,
        title: item.title,
        authors: item.authors ?? "",
        abstract: item.abstract ?? "",
        year: item.year,
        journal: item.journal ?? "",
        doi: item.doi ?? "",
        departmentId: item.departmentId,
      }}
    />
  );
}
