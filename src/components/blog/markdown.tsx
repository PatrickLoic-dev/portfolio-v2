import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { headingId } from "@/lib/slug";
import { CodeBlock, Tip } from "./mdx-parts";
import { ZoomableImage, type ZoomLabels } from "./zoomable-image";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node as { props: { children?: ReactNode } }).props.children);
  return "";
}

/**
 * Markdown → the article styles of the design (`.prose` in globals.css).
 * - `## Heading` gets the same id as the table of contents.
 * - Fenced code renders in the dark code card.
 * - `> [!TIP]` blockquotes render as the sage callout.
 * - Images open larger on click.
 */
export function Markdown({ source, zoom = { open: "Agrandir l'image", close: "Fermer" } }: { source: string; zoom?: ZoomLabels }) {
  const components: Components = {
    h2: ({ children }) => <h2 id={headingId(textOf(children).replace(/[*_`]/g, ""))}>{children}</h2>,
    pre: ({ children, node }) => {
      const code = (children as { props?: { className?: string; children?: ReactNode } })?.props;
      const lang = /language-(\w+)/.exec(code?.className ?? "")?.[1] ?? "";
      const label = { ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", sh: "Shell", bash: "Shell" }[lang] ?? lang.toUpperCase();
      // ```ts title="file.ts" — the info string's meta sits on the inner <code> node.
      const inner = node?.children[0] as { data?: { meta?: string } } | undefined;
      const title = /title="([^"]+)"/.exec(inner?.data?.meta ?? "")?.[1];
      return <CodeBlock file={title ?? (lang ? `snippet.${lang}` : "snippet")} lang={label} code={textOf(code?.children)} />;
    },
    blockquote: ({ children }) => {
      const raw = textOf(children).trim();
      if (raw.startsWith("[!TIP]")) {
        return <Tip>{raw.replace(/^\[!TIP\]\s*/, "")}</Tip>;
      }
      return <blockquote>{children}</blockquote>;
    },
    a: ({ href, children }) => {
      const external = href?.startsWith("http");
      return (
        <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
          {children}
        </a>
      );
    },
    // Click to enlarge (twice the size, over a dark backdrop).
    img: ({ src, alt }) => (typeof src === "string" ? <ZoomableImage src={src} alt={alt ?? ""} labels={zoom} /> : null),
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {source}
    </ReactMarkdown>
  );
}
