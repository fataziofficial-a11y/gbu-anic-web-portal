import { auth } from "@/auth";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { eq } from "drizzle-orm";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: rawId } = await params;
    const id = parseInt(rawId);
    if (isNaN(id)) return apiError("Неверный ID", 400);

    const file = await db.query.files.findFirst({ where: eq(files.id, id) });
    if (!file) return apiError("Файл не найден", 404);

    const isOwner = file.uploadedBy === parseInt(session.user.id);
    if (!isOwner && session.user.role !== "admin") return apiError("Доступ запрещён", 403);

    const path = await import("path");
    const { unlink } = await import("fs/promises");
    const filePath = path.join(process.env.APP_DIR || process.cwd(), "public", file.url);
    try { await unlink(filePath); } catch { /* игнорируем если файл уже удалён */ }

    await db.delete(files).where(eq(files.id, id));
    return apiSuccess({ deleted: true });
  });
}
