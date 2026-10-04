import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

/** Обложка новости с диска в JPEG (до 1600 px) — для загрузки в Telegram. */
export async function loadCoverJpeg(coverUrl: string | null | undefined): Promise<Buffer | null> {
  const m = coverUrl?.match(/^\/uploads\/(media|knowledge)\/([^/?#]+)$/);
  if (!m || m[2].includes("..")) return null;
  try {
    const src = await readFile(path.join(process.env.APP_DIR || process.cwd(), "public", "uploads", m[1], m[2]));
    return await sharp(src).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  } catch {
    return null;
  }
}
