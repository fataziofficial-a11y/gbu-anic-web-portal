/**
 * Отправка уведомлений администратору в Telegram.
 * Использует TELEGRAM_BOT_TOKEN + TELEGRAM_ADMIN_CHAT_ID из .env
 */
import { telegramCall } from "@/lib/crosspost/telegram-transport";

function esc(s: string) {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] ?? c));
}

export async function notifyAdmin(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return; // Telegram не настроен — тихо пропускаем

  try {
    // Через тот же транспорт, что и кросс-постинг: с сервера в РФ прямой
    // доступ к api.telegram.org закрыт, нужен прокси (TELEGRAM_PROXY).
    await telegramCall(token, "sendMessage", { chat_id: chatId, text: message, parse_mode: "HTML" });
  } catch {
    // Уведомление не критично — не падаем
  }
}

/** Текст уведомления о новом обращении с сайта. */
export function appealNotifyText(opts: { id: number; name: string; email: string; subject: string; message: string }): string {
  const msg = opts.message.length > 500 ? opts.message.slice(0, 500) + "…" : opts.message;
  return [
    `📨 <b>Новое обращение с сайта #${opts.id}</b>`,
    `<b>${esc(opts.subject)}</b>`,
    `${esc(opts.name)} · ${esc(opts.email)}`,
    ``,
    esc(msg),
    ``,
    `Ответить и отметить: аниц.рф/admin/appeals`,
  ].join("\n");
}

export function ticketNotifyText(opts: {
  id: number;
  title: string;
  type: string;
  priority: string;
  description: string;
  author: string;
}): string {
  const typeIcon: Record<string, string> = {
    bug: "🐛",
    suggestion: "💡",
    question: "❓",
  };
  const prioIcon: Record<string, string> = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  };
  const typeLabel: Record<string, string> = {
    bug: "Ошибка",
    suggestion: "Пожелание",
    question: "Вопрос",
  };
  const desc = opts.description.length > 300
    ? opts.description.slice(0, 300) + "…"
    : opts.description;

  return [
    `${typeIcon[opts.type] ?? "🎫"} <b>Новый тикет #${opts.id}</b>`,
    `<b>${esc(opts.title)}</b>`,
    ``,
    `${prioIcon[opts.priority] ?? ""} ${typeLabel[opts.type] ?? opts.type} · от <b>${esc(opts.author)}</b>`,
    ``,
    esc(desc),
    ``,
    `<a href="https://аниц.рф/admin/tickets/${opts.id}">Открыть в CMS →</a>`,
  ].join("\n");
}
