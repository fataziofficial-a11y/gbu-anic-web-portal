interface DzenPostOptions {
  title: string;
  excerpt?: string;
  url: string;
}

interface DzenResult {
  ok: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export async function postToDzen(opts: DzenPostOptions): Promise<DzenResult> {
  const publisherId = process.env.DZEN_PUBLISHER_ID;
  const apiKey = process.env.DZEN_API_KEY;

  if (!publisherId || !apiKey) {
    return { ok: false, error: "Яндекс.Дзен не настроен (нет DZEN_PUBLISHER_ID или DZEN_API_KEY)" };
  }

  try {
    const res = await fetch("https://dzen.ru/api/v1/publisher/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `OAuth ${apiKey}`,
      },
      body: JSON.stringify({
        publisher_id: publisherId,
        title: opts.title,
        content: opts.excerpt ?? opts.title,
        canonical_url: opts.url,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { ok: false, error: data.message ?? data.error ?? "Ошибка Дзен API" };
    }
    return {
      ok: true,
      postId: data.id,
      postUrl: data.url ?? `https://dzen.ru/a/${data.id}`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Сетевая ошибка" };
  }
}
