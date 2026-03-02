/**
 * POST /api/contact
 * Отправка формы обратной связи через SMTP (nodemailer)
 *
 * Body: { name, email, subject, message }
 *
 * Env:
 *   SMTP_HOST      — SMTP сервер (напр. smtp.yandex.ru)
 *   SMTP_PORT      — порт (465 для SSL, 587 для TLS)
 *   SMTP_USER      — логин (ваш email)
 *   SMTP_PASS      — пароль или app-password
 *   CONTACT_TO     — куда приходят письма (напр. info@anic.ru)
 */
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import { logger } from "@/lib/logger";

const schema = z.object({
  name: z.string().min(2, "Имя слишком короткое").max(100),
  email: z.string().email("Некорректный email"),
  subject: z.string().min(3, "Тема слишком короткая").max(200),
  message: z.string().min(10, "Сообщение слишком короткое").max(5000),
});

// Rate-limit: простой in-memory счётчик (сбрасывается при рестарте)
const submits = new Map<string, { count: number; ts: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60 * 1000; // 1 минута
  const max = 3;
  const entry = submits.get(ip);
  if (!entry || now - entry.ts > window) {
    submits.set(ip, { count: 1, ts: now });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "465");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function POST(req: NextRequest) {
  // IP для rate-limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте через минуту." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, email, subject, message } = parsed.data;
  const to = process.env.CONTACT_TO ?? process.env.SMTP_USER;
  const transport = createTransport();

  if (!transport || !to) {
    // SMTP не настроен — логируем и возвращаем успех (не ломаем UX)
    logger.warn("Contact: SMTP не настроен, письмо не отправлено", { name, email, subject });
    return NextResponse.json({ ok: true, stub: true });
  }

  try {
    await transport.sendMail({
      from: `"Форма сайта АНИЦ" <${process.env.SMTP_USER}>`,
      to,
      replyTo: `"${name}" <${email}>`,
      subject: `[Сайт АНИЦ] ${subject}`,
      text: `Имя: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#1e40af">Новое обращение с сайта</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:6px 0;color:#6b7280;width:80px">Имя:</td><td><b>${name}</b></td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Email:</td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Тема:</td><td>${subject}</td></tr>
          </table>
          <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb"/>
          <p style="white-space:pre-wrap;color:#111827">${message}</p>
        </div>
      `,
    });

    logger.info("Contact: письмо отправлено", { to, subject });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Contact: ошибка отправки письма", { name, email, subject, err: String(err) });
    return NextResponse.json(
      { error: "Ошибка отправки. Попробуйте позже или напишите напрямую на info@anic.ru" },
      { status: 500 }
    );
  }
}
