"use client";

import { motion, type Variants } from "motion/react";
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

const line: Variants = {
  hidden: { y: "110%" },
  show: (delay: number) => ({ y: "0%", transition: { duration: 0.9, ease: EASE, delay } }),
};

/**
 * Display headline that reveals line by line — each line slides up out of a mask.
 *
 * The in-view trigger sits on the heading itself: the lines start translated
 * outside their overflow-hidden masks, so observing them directly would never
 * fire. The mask is padded so uppercase accents (É, À) and descenders are never clipped.
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
  const Tag = motion[as] as typeof motion.h2;
  const trigger = immediate
    ? { animate: "show" }
    : { whileInView: "show", viewport: { once: true, amount: 0.2 } };

  return (
    <Tag
      className={cn("display", className)}
      style={style}
      initial="hidden"
      {...trigger}
    >
      {lines.map((text, i) => (
        <span
          key={i}
          className="block overflow-hidden"
          style={{ paddingTop: "0.14em", marginTop: "-0.14em", paddingBottom: "0.06em", marginBottom: "-0.06em" }}
        >
          <motion.span className="block" variants={line} custom={delay + i * 0.08}>
            {text}
            {accent && i === lines.length - 1 ? <span style={{ color: accentColor }}>{accent}</span> : null}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
