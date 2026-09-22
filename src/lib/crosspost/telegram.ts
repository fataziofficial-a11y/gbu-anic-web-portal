import { telegramCall } from "./telegram-transport";

interface TelegramPostOptions {
  title: string;
  excerpt?: string;
  url: string;
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

  const text = [
    `<b>${escTg(opts.title)}</b>`,
    opts.excerpt ? `\n${escTg(opts.excerpt)}` : "",
    `\n\n<a href="${opts.url}">Читать полностью →</a>`,
  ]
    .filter(Boolean)
    .join("");

  try {
    // Через telegramCall, а не через fetch: с сервера в России прямой доступ
    // к api.telegram.org закрыт, и запрос нужно вести через наш прокси.
    const data = await telegramCall(token, "sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    });

    if (!data.ok) {
      return { ok: false, error: data.description ?? "Ошибка Telegram API" };
    }
    return { ok: true, messageId: data.result?.message_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Сетевая ошибка" };
  }
}

function escTg(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
