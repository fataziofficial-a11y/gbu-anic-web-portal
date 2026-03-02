import { db } from "@/lib/db";
import { ProjectForm } from "@/components/admin/ProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const departments = await db.query.departments.findMany({
    columns: { id: true, name: true },
  });

  return <ProjectForm mode="create" departments={departments} />;
}
