interface OkPostOptions {
  title: string;
  excerpt?: string;
  url: string;
}

interface OkResult {
  ok: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export async function postToOk(opts: OkPostOptions): Promise<OkResult> {
  const accessToken = process.env.OK_ACCESS_TOKEN;
  const groupId = process.env.OK_GROUP_ID;
  const appKey = process.env.OK_APP_KEY;

  if (!accessToken || !groupId || !appKey) {
    return { ok: false, error: "Одноклассники не настроены (нет OK_ACCESS_TOKEN, OK_GROUP_ID или OK_APP_KEY)" };
  }

  const mediaText = [
    opts.title,
    opts.excerpt ? `\n${opts.excerpt}` : "",
    `\n\n${opts.url}`,
  ]
    .filter(Boolean)
    .join("");

  try {
    const params = new URLSearchParams({
      method: "stream.post",
      access_token: accessToken,
      application_key: appKey,
      type: "GROUP_THEME",
      gid: groupId,
      attachment: JSON.stringify({
        media: [{ type: "text", text: mediaText }],
      }),
    });

    const res = await fetch(`https://api.ok.ru/fb.do?${params.toString()}`);
    const data = await res.json();

    if (data.error_code || !data) {
      return { ok: false, error: data.error_msg ?? "Ошибка OK API" };
    }
    return {
      ok: true,
      postId: String(data),
      postUrl: `https://ok.ru/group/${groupId}/topic/${data}`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Сетевая ошибка" };
  }
}
