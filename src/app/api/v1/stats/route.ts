/**
 * GET /api/v1/stats
 * Публичный API — агрегированная статистика портала
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { news, projects, teamMembers, publications, knowledgeItems, departments } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { validateApiKey, V1_HEADERS } from "@/lib/utils/api-key";

// Кэшировать 5 минут
export const revalidate = 300;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: V1_HEADERS });
}

export async function GET(req: NextRequest) {
  const deny = validateApiKey(req);
  if (deny) return deny;

  const [
    newsCount,
    teamCount,
    deptCount,
    projectsActive,
    projectsTotal,
    pubsCount,
    kbCount,
  ] = await Promise.all([
    db.select({ count: count() }).from(news).where(eq(news.status, "published")),
    db.select({ count: count() }).from(teamMembers),
    db.select({ count: count() }).from(departments),
    db.select({ count: count() }).from(projects).where(eq(projects.status, "active")),
    db.select({ count: count() }).from(projects),
    db.select({ count: count() }).from(publications),
    db.select({ count: count() }).from(knowledgeItems).where(eq(knowledgeItems.status, "published")),
  ]);

  return NextResponse.json(
    {
      data: {
        news: Number(newsCount[0].count),
        team: Number(teamCount[0].count),
        departments: Number(deptCount[0].count),
        projects: {
          active: Number(projectsActive[0].count),
          total: Number(projectsTotal[0].count),
        },
        publications: Number(pubsCount[0].count),
        knowledgeBase: Number(kbCount[0].count),
      },
      generatedAt: new Date().toISOString(),
    },
    { headers: V1_HEADERS }
  );
}
