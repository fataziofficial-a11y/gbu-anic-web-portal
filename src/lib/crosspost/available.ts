// Какие площадки кросс-постинга подключены (есть учётные данные в .env.local).
// Галочки в форме новости показываются только для них: подключили площадку —
// галочка появилась сама, без правки кода.
export type PlatformId = "telegram" | "vk" | "max" | "dzen" | "ok";

export function availablePlatforms(): PlatformId[] {
  const has = (...keys: string[]) => keys.every((k) => !!process.env[k]?.trim());
  const list: PlatformId[] = [];
  if (has("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHANNEL_ID")) list.push("telegram");
  if (has("MAX_BOT_TOKEN", "MAX_CHANNEL_ID")) list.push("max");
  if (has("VK_ACCESS_TOKEN", "VK_GROUP_ID")) list.push("vk");
  if (has("DZEN_PUBLISHER_ID", "DZEN_API_KEY")) list.push("dzen");
  if (has("OK_ACCESS_TOKEN", "OK_GROUP_ID", "OK_APP_KEY")) list.push("ok");
  return list;
}
