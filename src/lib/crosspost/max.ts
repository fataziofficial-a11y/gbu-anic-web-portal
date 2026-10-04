import { composePost } from "./compose";

interface MaxPostOptions {
  title: string;
  excerpt?: string;
  url: string;
  /** Текст новости из редактора — пост дублирует новость целиком. */
  content?: unknown;
  /** Обложка в JPEG — уходит вложением к посту. */
  coverJpegUrl?: string | null;
}

interface MaxResult {
  ok: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

// Лимит текста сообщения в MAX — 4000 символов.
const MAX_TEXT = 4000;

async function send(token: string, chatId: string, body: Record<string, unknown>) {
  // Канал — в адресе запроса (?chat_id=), а не в теле: так требует MAX API.
  const res = await fetch(`https://botapi.max.ru/messages?chat_id=${encodeURIComponent(chatId)}`, {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && !data.code, data };
}

export async function postToMax(opts: MaxPostOptions): Promise<MaxResult> {
  const token = process.env.MAX_BOT_TOKEN;
  const chatId = process.env.MAX_CHANNEL_ID;

  if (!token || !chatId) {
    return { ok: false, error: "MAX не настроен (нет MAX_BOT_TOKEN или MAX_CHANNEL_ID)" };
  }

  // Полная новость; не влезает — обрезка и «Читать полностью».
  const text = composePost({
    title: opts.title, excerpt: opts.excerpt, content: opts.content ?? null, url: opts.url, limit: MAX_TEXT, flavor: "max",
  }).text;
  const base = { text, format: "html" };

  try {
    if (opts.coverJpegUrl) {
      const withImage = { ...base, attachments: [{ type: "image", payload: { url: opts.coverJpegUrl } }] };
      let r = await send(token, chatId, withImage);
      // Картинку MAX скачивает сам и может не успеть обработать — повторяем раз.
      if (!r.ok && String(r.data?.code ?? "").includes("attachment")) {
        await new Promise((ok) => setTimeout(ok, 2000));
        r = await send(token, chatId, withImage);
      }
      if (r.ok) return { ok: true, postId: String(r.data.message?.body?.mid ?? "") };
      // С картинкой не вышло — публикуем текст, чтобы новость не потерялась.
      const t = await send(token, chatId, base);
      if (t.ok) return { ok: true, postId: String(t.data.message?.body?.mid ?? ""), error: `без обложки: ${r.data?.message ?? r.data?.code ?? "ошибка вложения"}` };
      return { ok: false, error: t.data?.message ?? t.data?.code ?? "Ошибка MAX API" };
    }
    const r = await send(token, chatId, base);
    if (!r.ok) return { ok: false, error: r.data?.message ?? r.data?.code ?? "Ошибка MAX API" };
    return { ok: true, postId: String(r.data.message?.body?.mid ?? "") };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Сетевая ошибка" };
  }
}
