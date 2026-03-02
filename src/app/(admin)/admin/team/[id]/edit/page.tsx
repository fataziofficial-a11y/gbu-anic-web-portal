import { db } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { TeamForm } from "@/components/admin/TeamForm";

export const dynamic = "force-dynamic";

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const [item, departments] = await Promise.all([
    db.query.teamMembers.findFirst({ where: eq(teamMembers.id, id) }),
    db.query.departments.findMany({ columns: { id: true, name: true } }),
  ]);

  if (!item) notFound();

  return (
    <TeamForm
      mode="edit"
      departments={departments}
      initialData={{
        id: item.id,
        name: item.name,
        position: item.position ?? "",
        departmentId: item.departmentId,
        email: item.email ?? "",
        bio: item.bio ?? "",
        sortOrder: item.sortOrder ?? 0,
      }}
    />
  );
}
