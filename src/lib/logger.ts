/**
 * Структурированный JSON-логгер.
 *
 * Вывод в stdout (info/warn/debug) и stderr (error).
 * PM2 автоматически пишет эти потоки в файл:
 *   ~/.pm2/logs/<app>-out.log  — stdout
 *   ~/.pm2/logs/<app>-error.log — stderr
 *
 * Формат строки: {"ts":"ISO","level":"info","msg":"...","key":"value"}
 *
 * В dev-режиме (NODE_ENV !== production) используется console для
 * удобочитаемого вывода с цветом.
 */

type Level = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const IS_PROD = process.env.NODE_ENV === "production";

// ANSI-цвета для dev
const COLORS: Record<Level, string> = {
  debug: "\x1b[90m", // серый
  info:  "\x1b[36m", // cyan
  warn:  "\x1b[33m", // жёлтый
  error: "\x1b[31m", // красный
};
const RESET = "\x1b[0m";

function emit(level: Level, msg: string, ctx?: LogContext) {
  if (IS_PROD) {
    const entry = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      msg,
      ...ctx,
    });
    if (level === "error") {
      process.stderr.write(entry + "\n");
    } else {
      process.stdout.write(entry + "\n");
    }
  } else {
    const color = COLORS[level];
    const prefix = `${color}[${level.toUpperCase()}]${RESET}`;
    const ctxStr = ctx && Object.keys(ctx).length > 0 ? " " + JSON.stringify(ctx) : "";
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`${prefix} ${msg}${ctxStr}`);
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => emit("debug", msg, ctx),
  info:  (msg: string, ctx?: LogContext) => emit("info",  msg, ctx),
  warn:  (msg: string, ctx?: LogContext) => emit("warn",  msg, ctx),
  error: (msg: string, ctx?: LogContext) => emit("error", msg, ctx),
};
