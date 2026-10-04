import { telegramCall, telegramUpload } from "./telegram-transport";
import { composePost } from "./compose";

interface TelegramPostOptions {
  title: string;
  excerpt?: string;
  url: string;
  /** Текст новости из редактора — пост дублирует новость целиком. */
  content?: unknown;
  /** Обложка в JPEG (файл) — уходит фотографией. */
  coverJpeg?: Buffer | null;
}

interface TelegramResult {
  ok: boolean;
  messageId?: number;
  error?: string;
}

export async function postToTelegram(opts: TelegramPostOptions): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !chatId) {
    return { ok: false, error: "Telegram не настроен (нет TELEGRAM_BOT_TOKEN или TELEGRAM_CHANNEL_ID)" };
  }

  // Без обложки — обычное сообщение, лимит 4096 знаков.
  const full = opts.content !== undefined
    ? composePost({ title: opts.title, excerpt: opts.excerpt, content: opts.content, url: opts.url, limit: 4096, flavor: "tg", measure: visibleLength }).text
    : [`<b>${escTg(opts.title)}</b>`, opts.excerpt ? `\n${escTg(opts.excerpt)}` : "", `\n\n<a href="${opts.url}">Читать на сайте →</a>`].filter(Boolean).join("");

  try {
    // Через telegramCall/telegramUpload, а не fetch: с сервера в России прямой
    // доступ к api.telegram.org закрыт, запрос идёт через наш прокси.
    if (opts.coverJpeg) {
      // Один пост: фото с обложкой, в подписи — текст новости, сколько влезет в
      // 1024 знака подписи Telegram, дальше — ссылка «Читать на сайте».
      const caption = opts.content !== undefined
        ? composePost({ title: opts.title, excerpt: opts.excerpt, content: opts.content, url: opts.url, limit: 1024, flavor: "tg", measure: visibleLength }).text
        : full;
      const photo = await telegramUpload(token, "sendPhoto", {
        chat_id: chatId,
        caption,
        parse_mode: "HTML",
      }, { field: "photo", filename: "cover.jpg", contentType: "image/jpeg", data: opts.coverJpeg });
      if (!photo.ok) return { ok: false, error: photo.description ?? "Ошибка Telegram API (фото)" };
      return { ok: true, messageId: photo.result?.message_id };
    }

    const data = await telegramCall(token, "sendMessage", {
      chat_id: chatId, text: full, parse_mode: "HTML", link_preview_options: { is_disabled: true },
    });
    if (!data.ok) {
      return { ok: false, error: data.description ?? "Ошибка Telegram API" };
    }
    return { ok: true, messageId: data.result?.message_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Сетевая ошибка" };
  }
}

/** Длина текста, как её считает Telegram: без тегов, сущности — одним знаком. */
function visibleLength(html: string): number {
  return html.replace(/<[^>]+>/g, "").replace(/&(amp|lt|gt|quot);/g, "_").length;
}

function escTg(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
