/**
 * DeepSeek API client (OpenAI-совместимый протокол).
 * Использует нативный fetch — без дополнительных зависимостей.
 *
 * Env:
 *   DEEPSEEK_API_KEY   — ключ API (обязателен)
 *   DEEPSEEK_MODEL     — модель (по умолчанию: deepseek-chat)
 */

import { logger } from "@/lib/logger";

const BASE_URL = "https://api.deepseek.com/v1";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  maxTokens?: number;
  temperature?: number;
};

/**
 * Отправляет сообщения в DeepSeek и возвращает текст ответа.
 * Возвращает null если API не настроен или произошла ошибка.
 */
export async function chatCompletion(
  messages: Message[],
  opts: ChatOptions = {}
): Promise<string | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;

  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.3,
      }),
    });
  } catch (err) {
    logger.error("DeepSeek fetch error", { err: String(err) });
    return null;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error("DeepSeek API error", { status: res.status, body });
    return null;
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return data.choices?.[0]?.message?.content ?? null;
}

/** Проверяет, настроен ли DeepSeek API. */
export function isConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}
