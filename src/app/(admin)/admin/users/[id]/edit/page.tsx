import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { UserForm } from "@/components/admin/UserForm";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await db.query.users.findFirst({
    where: eq(users.id, parseInt(id)),
    columns: { passwordHash: false },
  });
  if (!user) notFound();

  return (
    <UserForm
      mode="edit"
      initialData={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions ?? null,
      }}
    />
  );
}
