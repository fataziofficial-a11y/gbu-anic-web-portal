/**
 * API key auth для /api/v1/*
 * Клиент передаёт: Authorization: Bearer <key>
 * или ?api_key=<key> в query string
 */
import { NextRequest, NextResponse } from "next/server";

export function validateApiKey(req: NextRequest): NextResponse | null {
  const apiKey = process.env.API_SECRET_KEY;
  if (!apiKey) return null; // Если ключ не задан — открытый доступ (dev mode)

  const authHeader = req.headers.get("authorization");
  const queryKey = req.nextUrl.searchParams.get("api_key");

  const provided = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : queryKey;

  if (!provided || provided !== apiKey) {
    return NextResponse.json(
      { error: "Unauthorized", hint: "Pass Authorization: Bearer <API_SECRET_KEY>" },
      { status: 401 }
    );
  }
  return null; // OK
}

/** Стандартные CORS-заголовки для публичного API */
export const V1_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
};
