/**
 * Текст поста для Telegram и MAX из новости: заголовок + полный текст из
 * редактора (Tiptap JSON) с жирным, курсивом, списками и ссылками. Если пост
 * не влезает в лимит площадки — обрезаем по абзацам и ставим «Читать на сайте».
 *
 * Разметка — HTML-подмножество, которое понимают обе площадки: <b>, <i>, <s>,
 * <a>. Цитаты в Telegram — <blockquote>, в MAX — курсивом.
 */

type TNode = {
  type: string;
  text?: string;
  content?: TNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
};
export type Flavor = "tg" | "max";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");

function inline(nodes: TNode[] | undefined): string {
  return (nodes ?? [])
    .map((n) => {
      if (n.type === "hardBreak") return "\n";
      if (n.type !== "text") return inline(n.content);
      let t = esc(n.text ?? "");
      for (const m of n.marks ?? []) {
        if (m.type === "bold") t = `<b>${t}</b>`;
        else if (m.type === "italic") t = `<i>${t}</i>`;
        else if (m.type === "strike") t = `<s>${t}</s>`;
        else if (m.type === "link") {
          const href = String(m.attrs?.href ?? "");
          if (/^https?:\/\//i.test(href)) t = `<a href="${escAttr(href)}">${t}</a>`;
        }
      }
      return t;
    })
    .join("");
}

function blocks(node: TNode, flavor: Flavor): string[] {
  const out: string[] = [];
  for (const n of node.content ?? []) {
    switch (n.type) {
      case "paragraph": {
        const t = inline(n.content).trim();
        if (t) out.push(t);
        break;
      }
      case "heading": {
        const t = inline(n.content).trim();
        if (t) out.push(`<b>${t}</b>`);
        break;
      }
      case "bulletList":
      case "orderedList": {
        const items = (n.content ?? []).map((li, i) => {
          const text = (li.content ?? []).map((c) => (c.type === "paragraph" ? inline(c.content) : blocks(c, flavor).join("\n"))).join("\n").trim();
          return `${n.type === "orderedList" ? `${i + 1}.` : "•"} ${text}`;
        });
        if (items.length) out.push(items.join("\n"));
        break;
      }
      case "blockquote": {
        const t = blocks(n, flavor).join("\n");
        if (t) out.push(flavor === "tg" ? `<blockquote>${t}</blockquote>` : `<i>${t}</i>`);
        break;
      }
      default:
        if (n.content) out.push(...blocks(n, flavor));
    }
  }
  return out;
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, "");

/** Пост целиком, а если не влезает в limit — обрезанный со ссылкой «Читать на сайте». */
export function composePost(opts: {
  title: string;
  excerpt?: string | null;
  content: unknown;
  url: string;
  limit: number;
  flavor: Flavor;
  /** Без заголовка — когда он уже ушёл подписью к фото. */
  noTitle?: boolean;
  /** Как считать длину: по умолчанию — длина строки с разметкой. Telegram
   *  считает видимый текст (без тегов). */
  measure?: (s: string) => number;
}): { text: string; truncated: boolean } {
  const len = opts.measure ?? ((s: string) => s.length);
  const head = opts.noTitle ? "" : `<b>${esc(opts.title.trim())}</b>`;
  let body = opts.content && typeof opts.content === "object" ? blocks(opts.content as TNode, opts.flavor) : [];
  if (body.length === 0 && opts.excerpt) body = [esc(opts.excerpt.trim())];

  const full = [head, ...body].filter(Boolean).join("\n\n");
  if (len(full) <= opts.limit) return { text: full, truncated: false };

  const more = `\n\n<a href="${escAttr(opts.url)}">Читать на сайте →</a>`;
  const room = opts.limit - len(more) - 2; // «…» и запас
  const parts = head ? [head] : [];
  let used = len(head);
  for (const b of body) {
    if (used + 2 + len(b) <= room) { parts.push(b); used += 2 + len(b); continue; }
    // Абзац не влез целиком: берём его начало без разметки, по границе слова.
    const left = room - used - 2;
    if (left > 120) {
      const plain = stripTags(b);
      const cut = plain.slice(0, left);
      const at = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(" "));
      parts.push(cut.slice(0, at > 60 ? at + 1 : cut.length).trim() + "…");
    }
    break;
  }
  return { text: parts.join("\n\n") + more, truncated: true };
}

/** Ссылка на обложку в JPEG (для превью Telegram и вложения MAX). */
export function coverJpegUrl(siteUrl: string, coverUrl: string | null | undefined): string | null {
  if (!coverUrl) return null;
  const m = coverUrl.match(/^\/uploads\/(media|knowledge)\/([^/?#]+)$/);
  if (!m) return null;
  return `${siteUrl.replace(/\/$/, "")}/api/uploads-jpeg/${m[1]}/${m[2]}.jpg`;
}
