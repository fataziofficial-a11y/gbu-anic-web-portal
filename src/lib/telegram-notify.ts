/**
 * Отправка уведомлений администратору в Telegram.
 * Использует TELEGRAM_BOT_TOKEN + TELEGRAM_ADMIN_CHAT_ID из .env
 */

function esc(s: string) {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] ?? c));
}

export async function notifyAdmin(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return; // Telegram не настроен — тихо пропускаем

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
  } catch {
    // Уведомление не критично — не падаем
  }
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
    `<a href="https://ase-msk.ru/admin/tickets/${opts.id}">Открыть в CMS →</a>`,
  ].join("\n");
}
