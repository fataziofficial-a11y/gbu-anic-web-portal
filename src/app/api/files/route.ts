import { auth } from "@/auth";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { desc } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  return withErrorHandler(async () => {
    const items = await db.query.files.findMany({
      orderBy: [desc(files.createdAt)],
      with: { uploader: true },
    });
    return apiSuccess({ items, total: items.length });
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "media";
    const altText = (formData.get("altText") as string) || undefined;

    if (!file) return apiError("Файл не выбран", 400);
    if (file.size > 50 * 1024 * 1024) return apiError("Файл слишком большой (макс. 50 МБ)", 400);

    const allowedFolders = ["media", "documents", "knowledge"];
    const safeFolder = allowedFolders.includes(folder) ? folder : "media";

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${safeFolder}/${filename}`;

    const [saved] = await db.insert(files).values({
      filename,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      url,
      folder: safeFolder as "media" | "documents" | "knowledge",
      altText,
      uploadedBy: parseInt(session.user.id),
    }).returning();

    return apiSuccess(saved, 201);
  });
}
