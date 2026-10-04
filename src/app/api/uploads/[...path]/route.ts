import { readFile } from "fs/promises";
import path from "path";

// Отдаёт загруженные файлы из public/uploads/ через route handler, читая диск
// на каждый запрос. Нужно потому, что standalone-сервер Next знает только те
// файлы, которые лежали в public/ на момент старта процесса. См. image-loader.ts.

const MIME_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const ALLOWED_FOLDERS = ["media", "documents", "knowledge"];

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  // saveToDisk в /api/files всегда пишет ровно как <folder>/<filename>
  if (segments.length !== 2) return notFound();

  const [folder, filename] = segments;
  if (!ALLOWED_FOLDERS.includes(folder)) return notFound();
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) return notFound();

  const contentType = MIME_TYPES[path.extname(filename).toLowerCase()];
  if (!contentType) return notFound();

  const filePath = path.join(
    process.env.APP_DIR || process.cwd(),
    "public",
    "uploads",
    folder,
    filename,
  );

  try {
    const data = await readFile(filePath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=2592000, immutable",
      },
    });
  } catch {
    return notFound();
  }
}
