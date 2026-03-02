/**
 * GET /api/v1/departments
 * Публичный API — список подразделений с руководителями
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { validateApiKey, V1_HEADERS } from "@/lib/utils/api-key";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: V1_HEADERS });
}

export async function GET(req: NextRequest) {
  const deny = validateApiKey(req);
  if (deny) return deny;

  const items = await db.query.departments.findMany({
    orderBy: [asc(departments.sortOrder)],
    with: {
      head: { columns: { name: true, position: true, email: true } },
    },
  });

  return NextResponse.json({ data: items }, { headers: V1_HEADERS });
}
