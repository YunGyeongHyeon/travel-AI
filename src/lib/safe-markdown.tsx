import { useMemo } from "react";

/**
 * Progressive / completed markdown rendering that never leaks raw ###, **, --- mid-stream.
 * Incomplete tokens stay buffered as plain text until a block is closable.
 */
export function stripIncompleteMarkdown(text: string, streaming: boolean): string {
  if (!streaming) return text;
  let s = text;
  // Hold trailing incomplete fence
  const fence = s.lastIndexOf("```");
  if (fence !== -1) {
    const after = s.slice(fence + 3);
    if (!after.includes("```")) {
      s = s.slice(0, fence).trimEnd();
    }
  }
  // Hold trailing incomplete heading line starting with #
  const lines = s.split("\n");
  const last = lines[lines.length - 1] ?? "";
  if (/^#{1,6}\s?[^#\n]*$/.test(last) && !last.match(/^#{1,6}\s+.+/)) {
    lines.pop();
    s = lines.join("\n");
  }
  // Hold unpaired ** or trailing *
  const stars = (s.match(/\*\*/g) || []).length;
  if (stars % 2 === 1) {
    const i = s.lastIndexOf("**");
    if (i !== -1) s = s.slice(0, i) + s.slice(i + 2);
  }
  // Hold a trailing horizontal rule fragment
  if (/(^|\n)-{1,2}$/.test(s) || /(^|\n)\*{1,2}$/.test(s)) {
    s = s.replace(/(^|\n)[-*]{1,2}$/, "$1");
  }
  return s;
}

/** Very small markdown → React-ish HTML string (escaped). Safe for assistant bubbles. */
export function renderSimpleMarkdown(src: string): string {
  const escape = (t: string) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList = false;
  const flushList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw;
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      flushList();
      html.push('<hr class="my-2 border-slate-200" />');
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      const cls =
        level === 1
          ? "text-sm font-black mt-2 mb-1"
          : level === 2
            ? "text-sm font-bold mt-2 mb-1"
            : "text-xs font-bold mt-1.5 mb-0.5";
      html.push(`<p class="${cls}">${inline(escape(h[2]))}</p>`);
      continue;
    }
    const li = line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    if (li) {
      if (!inList) {
        html.push('<ul class="list-disc pl-4 my-1 space-y-0.5">');
        inList = true;
      }
      html.push(`<li>${inline(escape(li[1]))}</li>`);
      continue;
    }
    if (!line.trim()) {
      flushList();
      html.push('<div class="h-1.5"></div>');
      continue;
    }
    flushList();
    html.push(`<p class="mb-1 last:mb-0">${inline(escape(line))}</p>`);
  }
  flushList();
  return html.join("");
}

function inline(escaped: string): string {
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-slate-100 text-[11px]">$1</code>');
}

export function useSafeMarkdown(content: string, streaming: boolean) {
  return useMemo(() => {
    const safe = stripIncompleteMarkdown(content, streaming);
    // While streaming, if we still have raw markers in incomplete form, show plain
    if (streaming && /(^|\n)#{1,6}(\s|$)/.test(safe.split("\n").pop() || "")) {
      return { html: null as string | null, plain: safe };
    }
    return { html: renderSimpleMarkdown(safe), plain: safe };
  }, [content, streaming]);
}
