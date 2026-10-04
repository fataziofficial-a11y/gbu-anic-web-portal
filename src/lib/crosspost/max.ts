interface MaxPostOptions {
  title: string;
  excerpt?: string;
  url: string;
}

interface MaxResult {
  ok: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export async function postToMax(opts: MaxPostOptions): Promise<MaxResult> {
  const token = process.env.MAX_BOT_TOKEN;
  const chatId = process.env.MAX_CHANNEL_ID;

  if (!token || !chatId) {
    return { ok: false, error: "MAX не настроен (нет MAX_BOT_TOKEN или MAX_CHANNEL_ID)" };
  }

  const text = [
    `**${opts.title}**`,
    opts.excerpt ? `\n${opts.excerpt}` : "",
    `\n\n[Читать полностью →](${opts.url})`,
  ]
    .filter(Boolean)
    .join("");

  try {
    // Канал — в адресе запроса (?chat_id=), а не в теле: так требует MAX API.
    const res = await fetch(`https://botapi.max.ru/messages?chat_id=${encodeURIComponent(chatId)}`, {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        format: "markdown",
      }),
    });

    const data = await res.json();
    if (!res.ok || data.code) {
      return { ok: false, error: data.message ?? data.code ?? "Ошибка MAX API" };
    }
    return { ok: true, postId: String(data.message?.body?.mid ?? data.id ?? "") };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Сетевая ошибка" };
  }
}
