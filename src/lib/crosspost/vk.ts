interface VkPostOptions {
  title: string;
  excerpt?: string;
  url: string;
}

interface VkResult {
  ok: boolean;
  postId?: number;
  postUrl?: string;
  error?: string;
}

export async function postToVk(opts: VkPostOptions): Promise<VkResult> {
  const token = process.env.VK_ACCESS_TOKEN;
  const groupId = process.env.VK_GROUP_ID;

  if (!token || !groupId) {
    return { ok: false, error: "ВКонтакте не настроен (нет VK_ACCESS_TOKEN или VK_GROUP_ID)" };
  }

  const message = [
    opts.title,
    opts.excerpt ? `\n${opts.excerpt}` : "",
    `\n\n${opts.url}`,
  ]
    .filter(Boolean)
    .join("");

  const params = new URLSearchParams({
    owner_id: `-${groupId}`, // negative = group
    from_group: "1",
    message,
    access_token: token,
    v: "5.199",
  });

  try {
    const res = await fetch(`https://api.vk.com/method/wall.post?${params}`, {
      method: "POST",
    });
    const data = await res.json();

    if (data.error) {
      return { ok: false, error: data.error.error_msg ?? "Ошибка VK API" };
    }

    const postId: number = data.response?.post_id;
    return {
      ok: true,
      postId,
      postUrl: `https://vk.com/wall-${groupId}_${postId}`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Сетевая ошибка" };
  }
}
