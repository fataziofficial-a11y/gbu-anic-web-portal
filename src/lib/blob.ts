/**
 * Vercel Blob Storage — тонкая обёртка над REST API.
 * Не требует npm-пакета @vercel/blob.
 * Документация: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
 */

const BLOB_API = "https://blob.vercel-storage.com";

export interface BlobResult {
  url: string;
  pathname: string;
  contentType: string;
}

/**
 * Загружает файл в Vercel Blob и возвращает публичный URL.
 * Требует: BLOB_READ_WRITE_TOKEN в env.
 */
export async function putBlob(
  pathname: string,
  body: Buffer,
  contentType: string
): Promise<BlobResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN не задан");

  const res = await fetch(`${BLOB_API}/${pathname}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
      "x-api-version": "7",
      "x-content-type": contentType,
    },
    body: body as unknown as BodyInit,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel Blob error ${res.status}: ${text}`);
  }

  return res.json() as Promise<BlobResult>;
}

/**
 * Удаляет файл из Vercel Blob по публичному URL.
 */
export async function deleteBlob(url: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;

  await fetch(`${BLOB_API}/delete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-api-version": "7",
    },
    body: JSON.stringify({ urls: [url] }),
  }).catch(() => {
    /* игнорируем ошибки при удалении */
  });
}
