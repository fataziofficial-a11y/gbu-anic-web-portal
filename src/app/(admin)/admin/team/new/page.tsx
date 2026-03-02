import { db } from "@/lib/db";
import { TeamForm } from "@/components/admin/TeamForm";

export const dynamic = "force-dynamic";

export default async function NewTeamMemberPage() {
  const departments = await db.query.departments.findMany({
    columns: { id: true, name: true },
  });

  return <TeamForm mode="create" departments={departments} />;
}
