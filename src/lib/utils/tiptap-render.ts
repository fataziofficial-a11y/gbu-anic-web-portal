type TNode = {
  type: string;
  text?: string;
  content?: TNode[];
  marks?: { type: string; attrs?: Record<string, string> }[];
  attrs?: Record<string, unknown>;
};

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarks(text: string, marks?: TNode["marks"]): string {
  if (!marks || marks.length === 0) return escHtml(text);
  return marks.reduce((acc, mark) => {
    switch (mark.type) {
      case "bold":
        return `<strong>${acc}</strong>`;
      case "italic":
        return `<em>${acc}</em>`;
      case "strike":
        return `<s>${acc}</s>`;
      case "code":
        return `<code>${acc}</code>`;
      case "link": {
        const rawHref = mark.attrs?.href ?? "#";
        const hrefLower = rawHref.trim().toLowerCase();
        if (hrefLower.startsWith("javascript:") || hrefLower.startsWith("data:")) {
          return acc;
        }
        const href = escHtml(rawHref);
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${acc}</a>`;
      }
      default:
        return acc;
    }
  }, escHtml(text));
}

function renderNode(node: TNode): string {
  if (node.type === "text") {
    return renderMarks(node.text ?? "", node.marks);
  }
  const inner = (node.content ?? []).map(renderNode).join("");
  switch (node.type) {
    case "doc":
      return inner;
    case "paragraph":
      return inner ? `<p>${inner}</p>` : "<p><br /></p>";
    case "heading": {
      const lvl = Math.max(1, Math.min(6, Number(node.attrs?.level) || 2));
      return `<h${lvl}>${inner}</h${lvl}>`;
    }
    case "bulletList":
      return `<ul>${inner}</ul>`;
    case "orderedList":
      return `<ol>${inner}</ol>`;
    case "listItem":
      return `<li>${inner}</li>`;
    case "blockquote":
      return `<blockquote>${inner}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${inner}</code></pre>`;
    case "hardBreak":
      return "<br />";
    case "horizontalRule":
      return "<hr />";
    default:
      return inner;
  }
}

export function renderTiptap(content: unknown): string {
  if (!content) return "";
  try {
    return renderNode(content as TNode);
  } catch {
    return "";
  }
}

/** Извлекает plain-text из Tiptap JSON */
export function tiptapToText(content: unknown): string {
  if (!content) return "";
  try {
    const node = content as TNode;
    function getText(n: TNode): string {
      if (n.type === "text") return n.text ?? "";
      return (n.content ?? []).map(getText).join(" ");
    }
    return getText(node).replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}
