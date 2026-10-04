import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

// Обложка в JPEG для соцсетей. Загруженные картинки хранятся в WebP, а
// Telegram (превью) и MAX (вложение) надёжно принимают только JPEG/PNG.
// /api/uploads-jpeg/<папка>/<файл> → тот же файл из public/uploads, ужатый
// до 1600 px по ширине, в JPEG.

const ALLOWED_FOLDERS = ["media", "knowledge"];
const IMAGE_EXT = [".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif"];
const notFound = () => new Response("Not found", { status: 404 });

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  if (segments.length !== 2) return notFound();
  const [folder, rawName] = segments;
  // Расширение .jpg в адресе — для площадок, которые судят о типе по ссылке.
  const filename = rawName.replace(/\.jpe?g$/i, "") || rawName;
  if (!ALLOWED_FOLDERS.includes(folder)) return notFound();
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) return notFound();
  if (!IMAGE_EXT.includes(path.extname(filename).toLowerCase())) return notFound();

  const filePath = path.join(process.env.APP_DIR || process.cwd(), "public", "uploads", folder, filename);
  try {
    const src = await readFile(filePath);
    const jpeg = await sharp(src).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=2592000, immutable" },
    });
  } catch {
    return notFound();
  }
}
