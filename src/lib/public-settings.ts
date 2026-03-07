import { unstable_noStore as noStore } from "next/cache";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

const PUBLIC_SETTING_KEYS = [
  "site_name",
  "site_description",
  "contact_email",
  "contact_phone",
  "contact_address",
] as const;

export interface PublicSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
}

const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  site_name: "ГБУ АНИЦ",
  site_description: "Арктический научно-исследовательский центр",
  contact_email: "info@anic.ru",
  contact_phone: "+7 (4112) 00-00-00",
  contact_address: "г. Якутск, Республика Саха (Якутия)",
};

export async function getPublicSettings(): Promise<PublicSettings> {
  // Always read fresh settings so admin changes are reflected immediately.
  noStore();

  if (!process.env.DATABASE_URL) {
    logger.warn("Public settings: DATABASE_URL is not set, using defaults");
    return DEFAULT_PUBLIC_SETTINGS;
  }

  let rows: Array<{ key: string; value: string | null }> = [];
  try {
    rows = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(inArray(settings.key, [...PUBLIC_SETTING_KEYS]));
  } catch (error) {
    logger.error("Public settings: failed to load from DB, using defaults", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return DEFAULT_PUBLIC_SETTINGS;
  }

  const values: Record<string, string> = {};
  for (const row of rows) {
    if (row.value && row.value.trim().length > 0) {
      values[row.key] = row.value.trim();
    }
  }

  return {
    site_name: values.site_name ?? DEFAULT_PUBLIC_SETTINGS.site_name,
    site_description: values.site_description ?? DEFAULT_PUBLIC_SETTINGS.site_description,
    contact_email: values.contact_email ?? DEFAULT_PUBLIC_SETTINGS.contact_email,
    contact_phone: values.contact_phone ?? DEFAULT_PUBLIC_SETTINGS.contact_phone,
    contact_address: values.contact_address ?? DEFAULT_PUBLIC_SETTINGS.contact_address,
  };
}
