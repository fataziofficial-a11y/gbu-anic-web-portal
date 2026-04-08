import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { SessionProvider } from "@/components/admin/SessionProvider";
import { Toaster } from "@/components/ui/sonner";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CMS — ГБУ АНИЦ",
  description: "Система управления контентом Арктического научно-исследовательского центра",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Страница логина — без сайдбара
  if (!session) {
    return (
      <SessionProvider>
        {children}
        <Toaster position="top-right" />
      </SessionProvider>
    );
  }

  // Загружаем актуальные permissions из БД (чтобы изменения сразу применялись)
  let permissions: string[] | null = null;
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, Number(session.user.id)),
      columns: { permissions: true },
    });
    permissions = user?.permissions ?? null;
  } catch {
    // ignore — используем дефолт роли
  }

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <AdminSidebar user={{ ...session.user, permissions }} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        <Toaster position="top-right" />
      </div>
    </SessionProvider>
  );
}
