import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PartnerForm } from "@/components/admin/PartnerForm";

export const dynamic = "force-dynamic";

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const item = await db.query.partners.findFirst({
    where: eq(partners.id, id),
    with: { logo: true },
  });
  if (!item) notFound();

  return (
    <PartnerForm
      mode="edit"
      initialData={{
        id: item.id,
        name: item.name,
        logoId: item.logoId,
        logo: item.logo ? { id: item.logo.id, url: item.logo.url } : null,
        description: item.description,
        services: item.services,
        websiteUrl: item.websiteUrl,
        sortOrder: item.sortOrder ?? 0,
      }}
    />
  );
}
