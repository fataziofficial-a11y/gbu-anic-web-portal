import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Стандартный формат ответа API
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

/**
 * Обёртка для API-обработчиков с try-catch
 */
export async function withErrorHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    logger.error("Unhandled API error", {
      err: error instanceof Error ? error.message : String(error),
    });
    const message =
      error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return apiError(message, 500);
  }
}
