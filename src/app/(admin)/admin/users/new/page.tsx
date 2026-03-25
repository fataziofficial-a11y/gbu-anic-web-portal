import { UserForm } from "@/components/admin/UserForm";

export const dynamic = "force-dynamic";

export default function NewUserPage() {
  return <UserForm mode="create" />;
}
