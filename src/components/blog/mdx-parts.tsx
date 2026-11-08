import { Info } from "lucide-react";
import type { ReactNode } from "react";

/** Tiny highlighter: keywords → peach, strings → leaf. Enough for short snippets. */
function highlight(code: string) {
  const re = /('[^']*'|"[^"]*"|`[^`]*`)|\b(const|let|return|await|async|import|from|export|function|new|if|else)\b/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    out.push(
      <span key={m.index} className={m[1] ? "text-blob-b" : "text-blob-a"}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  out.push(code.slice(last));
  return out;
}

export function CodeBlock({ file, lang, code }: { file: string; lang: string; code: string }) {
  return (
    <figure className="mb-7 mt-0 overflow-hidden rounded-[18px] bg-ink text-background">
      <figcaption className="label flex justify-between border-b border-background/12 px-[18px] py-3 text-background/60">
        <span>{file}</span>
        <span>{lang}</span>
      </figcaption>
      <pre className="m-0 overflow-x-auto whitespace-pre px-[18px] py-5 font-mono text-sm leading-[1.7]">
        <code>{highlight(code.trim())}</code>
      </pre>
    </figure>
  );
}

export function Tip({ children }: { children: ReactNode }) {
  return (
    <aside className="mb-7 flex items-start gap-3.5 rounded-[18px] bg-secondary px-6 py-[22px]">
      <Info size={22} className="mt-0.5 flex-none" aria-hidden />
      <div className="text-base leading-relaxed [&>p]:m-0 [&>p]:text-base">{children}</div>
    </aside>
  );
}
