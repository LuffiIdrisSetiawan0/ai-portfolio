import { Fragment, type ReactNode } from "react";

/** Parse inline **bold** and `code` into React nodes. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-b${i}`} className="text-paper font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <code
          key={`${keyPrefix}-c${i}`}
          className="font-mono text-[0.85em] text-aqua bg-white/5 px-1.5 py-0.5 rounded"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + tok.length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Minimal, dependency-free markdown renderer for agent deliverables. */
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(<hr key={key++} className="my-5 border-line" />);
      i++;
      continue;
    }

    // headings
    const h = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (h) {
      const level = h[1].length;
      const cls =
        level <= 2
          ? "font-display text-xl sm:text-2xl font-semibold text-paper mt-6 mb-2"
          : "font-display text-lg font-semibold text-paper mt-5 mb-2";
      blocks.push(
        <p key={key++} className={cls}>
          {inline(h[2], `h${key}`)}
        </p>,
      );
      i++;
      continue;
    }

    // blockquote
    if (trimmed.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="border-l-2 border-aqua/60 pl-4 my-4 text-mist italic"
        >
          {inline(quote.join(" "), `q${key}`)}
        </blockquote>,
      );
      continue;
    }

    // unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-3 space-y-1.5 pl-1">
          {items.map((it, idx) => (
            <li key={idx} className="flex gap-2.5 text-mist">
              <span className="mt-2 h-1 w-1 flex-none rounded-full bg-aqua" />
              <span>{inline(it, `ul${key}-${idx}`)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="my-3 space-y-1.5">
          {items.map((it, idx) => (
            <li key={idx} className="flex gap-3 text-mist">
              <span className="font-mono text-xs text-violet pt-0.5">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span>{inline(it, `ol${key}-${idx}`)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // paragraph (gather consecutive plain lines)
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,4}\s|[-*]\s|\d+\.\s|>)/.test(lines[i].trim()) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push(
      <p key={key++} className="my-3 leading-relaxed text-mist">
        {inline(para.join(" "), `p${key}`)}
      </p>,
    );
  }

  return <Fragment>{blocks}</Fragment>;
}
