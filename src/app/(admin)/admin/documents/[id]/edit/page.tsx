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

  const item = await db.query.documents.findFirst({
    where: eq(documents.id, id),
    with: { file: { columns: { id: true, url: true, originalName: true } } },
  });
  if (!item) notFound();

  const itemWithFile = item as typeof item & { file?: { id: number; url: string; originalName: string } | null };

  return (
    <DocumentForm
      mode="edit"
      initialData={{
        id: item.id,
        title: item.title,
        docType: item.docType ?? "normative",
        fileId: item.fileId,
        fileUrl: item.fileUrl,
        issuedAt: item.issuedAt,
        status: item.status ?? "active",
        sortOrder: item.sortOrder ?? 0,
        section: item.section,
        sectionOrder: item.sectionOrder ?? 0,
        file: itemWithFile.file ?? null,
      }}
    />
  );
}
