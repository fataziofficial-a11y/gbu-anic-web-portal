import { db } from "@/lib/db";
import { mediaItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { MediaForm } from "@/components/admin/MediaForm";

export const dynamic = "force-dynamic";

export default async function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const item = await db.query.mediaItems.findFirst({
    where: eq(mediaItems.id, id),
    with: { thumbnail: true },
  });
  if (!item) notFound();

  return (
    <MediaForm
      mode="edit"
      initialData={{
        id: item.id,
        title: item.title,
        description: item.description,
        type: (item.type as "video" | "photo") ?? "video",
        videoUrl: item.videoUrl,
        thumbnailId: item.thumbnailId,
        thumbnail: item.thumbnail ? { id: item.thumbnail.id, url: item.thumbnail.url } : null,
        eventDate: item.eventDate,
        status: item.status ?? "published",
      }}
    />
  );
}
