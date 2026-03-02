import { ProcurementForm } from "@/components/admin/ProcurementForm";

export const dynamic = "force-dynamic";

export default function NewProcurementPage() {
  return <ProcurementForm mode="create" />;
}
