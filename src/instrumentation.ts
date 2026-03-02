/**
 * Next.js Instrumentation Hook.
 * Выполняется один раз при старте сервера.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logger } = await import("@/lib/logger");

    logger.info("Сервер АНИЦ запущен", {
      env: process.env.NODE_ENV,
      meilisearch: Boolean(process.env.MEILISEARCH_HOST),
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
      smtp: Boolean(process.env.SMTP_HOST),
    });
  }
}
