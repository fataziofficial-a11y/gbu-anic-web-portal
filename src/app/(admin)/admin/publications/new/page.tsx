import { db } from "@/lib/db";
import { PublicationForm } from "@/components/admin/PublicationForm";

export const dynamic = "force-dynamic";

export default async function NewPublicationPage() {
  const departments = await db.query.departments.findMany({
    columns: { id: true, name: true },
  });
  return <PublicationForm mode="create" departments={departments} />;
}
