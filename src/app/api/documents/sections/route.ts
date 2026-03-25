import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { apiSuccess, withErrorHandler } from "@/lib/utils/api";
import { sql, min } from "drizzle-orm";

export async function GET() {
  return withErrorHandler(async () => {
    const rows = await db
      .select({
        section: documents.section,
        minOrder: min(documents.sectionOrder),
      })
      .from(documents)
      .groupBy(documents.section)
      .orderBy(sql`MIN(${documents.sectionOrder})`);

    const sections = rows.map((r) => r.section).filter(Boolean) as string[];
    return apiSuccess(sections);
  });
}
