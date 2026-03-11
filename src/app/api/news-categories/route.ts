import { auth } from "@/auth";
import { db } from "@/lib/db";
import { newsCategories } from "@/lib/db/schema";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/utils/api";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

function slugify(text: string): string {
  const map: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",
    й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",
    у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",
    э:"e",ю:"yu",я:"ya",
  };
  return text.toLowerCase().split("").map((c) => map[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

// GET /api/news-categories — публичный список категорий
export async function GET() {
  return withErrorHandler(async () => {
    const items = await db.query.newsCategories.findMany({
      orderBy: [asc(newsCategories.sortOrder), asc(newsCategories.name)],
    });
    return apiSuccess({ items });
  });
}

// POST /api/news-categories — создать категорию
export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const body = await request.json();
    const parsed = z.object({ name: z.string().min(1).max(100) }).safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

    const slug = slugify(parsed.data.name);

    const existing = await db.query.newsCategories.findFirst({
      where: eq(newsCategories.slug, slug),
    });
    if (existing) return apiError("Категория уже существует", 409);

    const [created] = await db.insert(newsCategories).values({
      name: parsed.data.name,
      slug,
    }).returning();

    return apiSuccess(created, 201);
  });
}
