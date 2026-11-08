"use client";

import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { EASE } from "./ease";

type Props = {
  /** Lines separated by "\n". */
  text: string;
  /** Trailing punctuation rendered in the accent colour ("." or "?"). */
  accent?: string;
  accentColor?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
  className?: string;
  style?: CSSProperties;
  delay?: number;
  /** Animate on mount (hero) instead of when scrolled into view. */
  immediate?: boolean;
};

/**
 * Display headline that reveals line by line — each line slides up out of a mask.
 * The mask is padded so uppercase accents (É, À) and descenders are never clipped.
 */
export function SplitHeadline({
  text,
  accent,
  accentColor = "var(--accent)",
  as = "h2",
  className,
  style,
  delay = 0,
  immediate = false,
}: Props) {
  const lines = text.split("\n");
  const Tag = as;
  const trigger = immediate
    ? { animate: { y: "0%" } }
    : { whileInView: { y: "0%" }, viewport: { once: true, margin: "0px 0px -8% 0px" } };

  return (
    <Tag className={cn("display", className)} style={style}>
      {lines.map((line, i) => (
        <span
          key={i}
          className="block overflow-hidden"
          style={{ paddingTop: "0.14em", marginTop: "-0.14em", paddingBottom: "0.06em", marginBottom: "-0.06em" }}
        >
          <motion.span
            className="block"
            initial={{ y: "110%" }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.08 }}
            {...trigger}
          >
            {line}
            {accent && i === lines.length - 1 ? <span style={{ color: accentColor }}>{accent}</span> : null}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
