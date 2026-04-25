import { auth } from "@/auth";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { putBlob } from "@/lib/blob";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

const isVercel = Boolean(process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN);

async function saveToDisk(buffer: Buffer, folder: string, filename: string): Promise<string> {
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");
  const uploadDir = path.join(process.env.APP_DIR || process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

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
    const rawBuffer = Buffer.from(bytes);

    const isProcessableImage =
      file.type.startsWith("image/") &&
      file.type !== "image/gif" &&
      file.type !== "image/svg+xml";

    let fileBuffer: Buffer;
    let filename: string;
    let mimeType: string;
    let sizeBytes: number;

    if (isProcessableImage) {
      fileBuffer = await sharp(rawBuffer)
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      filename = `${uuidv4()}.webp`;
      mimeType = "image/webp";
      sizeBytes = fileBuffer.length;
    } else {
      const path = await import("path");
      fileBuffer = rawBuffer;
      const ext = path.extname(file.name).toLowerCase();
      filename = `${uuidv4()}${ext}`;
      mimeType = file.type || "application/octet-stream";
      sizeBytes = file.size;
    }

    let url: string;
    if (isVercel) {
      const blob = await putBlob(`uploads/${safeFolder}/${filename}`, fileBuffer, mimeType);
      url = blob.url;
    } else {
      url = await saveToDisk(fileBuffer, safeFolder, filename);
    }

    const [saved] = await db.insert(files).values({
      filename,
      originalName: file.name,
      mimeType,
      sizeBytes,
      url,
      folder: safeFolder as "media" | "documents" | "knowledge",
      altText,
      uploadedBy: parseInt(session.user.id),
    }).returning();

    return apiSuccess(saved, 201);
  });
}
