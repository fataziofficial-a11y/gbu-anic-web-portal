import { db } from "@/lib/db";
import { PageForm } from "@/components/admin/PageForm";

export const dynamic = "force-dynamic";

export default async function NewPagePage() {
  const allPages = await db.query.pages.findMany({
    columns: { id: true, title: true },
  });

  return <PageForm mode="create" pages={allPages} />;
}
