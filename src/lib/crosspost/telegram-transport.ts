/**
 * Запрос к Telegram Bot API с сервера в России.
 *
 * Прямой доступ к api.telegram.org с нашего VPS закрыт: запрос уходит в
 * никуда и отваливается по таймауту. Поэтому идём через собственный прокси в
 * Нидерландах — адрес в TELEGRAM_PROXY. Без переменной ходим напрямую: на
 * машине вне РФ прокси не нужен, а лишний посредник — лишняя точка отказа.
 *
 * Своя реализация вместо undici.ProxyAgent: пакет в зависимостях проекта не
 * значится, а CONNECT-туннель — это двадцать строк.
 */
import https from "node:https";
import net from "node:net";
import tls from "node:tls";

const PROXY = process.env.TELEGRAM_PROXY?.trim() ?? "";
const TIMEOUT_MS = 15_000;

function connectThroughProxy(host: string, port: number): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const p = new URL(PROXY.startsWith("http") ? PROXY : `http://${PROXY}`);
    const sock = net.connect({ host: p.hostname, port: Number(p.port) || 8888 }, () => {
      sock.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n\r\n`);
    });
    sock.setTimeout(TIMEOUT_MS, () => {
      sock.destroy();
      reject(new Error("прокси не ответил"));
    });
    let buf = "";
    const onData = (chunk: Buffer) => {
      buf += chunk.toString("latin1");
      if (!buf.includes("\r\n\r\n")) return;
      sock.removeListener("data", onData);
      sock.setTimeout(0);
      const statusLine = buf.split("\r\n")[0];
      if (!/\s2\d\d\s/.test(statusLine)) {
        sock.destroy();
        reject(new Error(`прокси отказал: ${statusLine}`));
        return;
      }
      resolve(sock);
    };
    sock.on("data", onData);
    sock.on("error", reject);
  });
}

// Именно агент, а не опция createConnection в самом запросе: её https.request
// молча игнорирует и уходит напрямую — выглядит как «иногда работает».
// Присваиваем метод экземпляру, а не наследуем: у типов Node сигнатура
// createConnection синхронная, а туннель поднимается асинхронно.
function makeProxyAgent(): https.Agent {
  const agent = new https.Agent({ keepAlive: false });
  (agent as unknown as { createConnection: unknown }).createConnection = (
    options: { host?: string; port?: number },
    callback: (err: Error | null, socket?: net.Socket) => void,
  ) => {
    const host = String(options.host ?? "api.telegram.org");
    const port = Number(options.port ?? 443);
    connectThroughProxy(host, port)
      .then((sock) => callback(null, tls.connect({ socket: sock, servername: host })))
      .catch((err: Error) => callback(err));
  };
  return agent;
}

/** POST в Telegram Bot API. Возвращает разобранный ответ метода. */
export function telegramCall(
  token: string,
  method: string,
  payload: unknown,
): Promise<{ ok: boolean; description?: string; result?: { message_id?: number } }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        host: "api.telegram.org",
        port: 443,
        method: "POST",
        path: `/bot${token}/${method}`,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        agent: PROXY ? makeProxyAgent() : undefined,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Telegram вернул не JSON (${res.statusCode})`));
          }
        });
      },
    );
    req.on("error", (e: Error) => reject(new Error(e.message || "сетевая ошибка")));
    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error("Telegram не ответил")));
    req.end(body);
  });
}

/**
 * Отправка с файлом (multipart/form-data) — например sendPhoto с обложкой.
 * Файл грузим сами: превью по ссылке Telegram строит ненадёжно, а загрузка
 * не зависит от того, достучится ли он до нашего сайта.
 */
export function telegramUpload(
  token: string,
  method: string,
  fields: Record<string, string>,
  file: { field: string; filename: string; contentType: string; data: Buffer },
): Promise<{ ok: boolean; description?: string; result?: { message_id?: number } }> {
  return new Promise((resolve, reject) => {
    const boundary = "----anic" + Math.random().toString(16).slice(2);
    const parts: Buffer[] = [];
    for (const [k, v] of Object.entries(fields)) {
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`, "utf8"));
    }
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`,
      "utf8",
    ));
    parts.push(file.data, Buffer.from(`\r\n--${boundary}--\r\n`, "utf8"));
    const body = Buffer.concat(parts);
    const req = https.request(
      {
        host: "api.telegram.org",
        port: 443,
        method: "POST",
        path: `/bot${token}/${method}`,
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": body.length },
        agent: PROXY ? makeProxyAgent() : undefined,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); } catch { reject(new Error(`Telegram вернул не JSON (${res.statusCode})`)); }
        });
      },
    );
    req.on("error", (e: Error) => reject(new Error(e.message || "сетевая ошибка")));
    req.setTimeout(30_000, () => req.destroy(new Error("Telegram не ответил")));
    req.write(body);
    req.end();
  });
}
