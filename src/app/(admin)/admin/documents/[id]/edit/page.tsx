import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DocumentForm } from "@/components/admin/DocumentForm";

export const dynamic = "force-dynamic";

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const item = await db.query.documents.findFirst({ where: eq(documents.id, id) });
  if (!item) notFound();

  return (
    <DocumentForm
      mode="edit"
      initialData={{
        id: item.id,
        title: item.title,
        docType: item.docType ?? "normative",
        fileUrl: item.fileUrl,
        issuedAt: item.issuedAt,
        status: item.status ?? "active",
        sortOrder: item.sortOrder ?? 0,
      }}
    />
  );
}
