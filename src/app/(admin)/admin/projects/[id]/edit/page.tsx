import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/ProjectForm";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const [item, departments] = await Promise.all([
    db.query.projects.findFirst({ where: eq(projects.id, id) }),
    db.query.departments.findMany({ columns: { id: true, name: true } }),
  ]);

  if (!item) notFound();

  return (
    <ProjectForm
      mode="edit"
      departments={departments}
      initialData={{
        id: item.id,
        title: item.title,
        description: item.description ?? "",
        departmentId: item.departmentId,
        status: item.status ?? "planned",
        startDate: item.startDate ?? "",
        endDate: item.endDate ?? "",
      }}
    />
  );
}
