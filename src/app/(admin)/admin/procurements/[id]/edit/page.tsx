import { db } from "@/lib/db";
import { procurements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProcurementForm } from "@/components/admin/ProcurementForm";

export const dynamic = "force-dynamic";

export default async function EditProcurementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const item = await db.query.procurements.findFirst({ where: eq(procurements.id, id) });
  if (!item) notFound();

  return (
    <ProcurementForm
      mode="edit"
      initialData={{
        id: item.id,
        title: item.title,
        description: item.description,
        eisUrl: item.eisUrl,
        publishedAt: item.publishedAt,
        deadline: item.deadline,
        amount: item.amount,
        status: item.status ?? "open",
      }}
    />
  );
}
