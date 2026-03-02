import { DocumentForm } from "@/components/admin/DocumentForm";

export const dynamic = "force-dynamic";

export default function NewDocumentPage() {
  return <DocumentForm mode="create" />;
}
