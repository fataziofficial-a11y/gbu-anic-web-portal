import type { Session } from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { canAccess } from "@/lib/permissions";

/**
 * Доступ к обращениям граждан — только у тех, кому открыт раздел «Обращения»
 * (по умолчанию — администратор). В обращениях персональные данные, поэтому
 * проверяем на сервере, а не только скрываем пункт меню.
 */
export async function canSeeAppeals(session: Session | null): Promise<boolean> {
  if (!session?.user) return false;
  const role = session.user.role ?? "author";
  if (role === "admin") return true;
  const u = await db.query.users.findFirst({
    where: eq(users.id, Number(session.user.id)),
    columns: { permissions: true },
  });
  return canAccess(role, "appeals", u?.permissions ?? null);
}
