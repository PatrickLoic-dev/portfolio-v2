"use client";

import { Copy, Link2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { DrawnCheck } from "@/components/action-button";
import { EASE } from "@/components/motion/ease";
import { cn } from "@/lib/cn";

const swap = {
  initial: { opacity: 0, y: 8, filter: "blur(2px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(2px)" },
  transition: { duration: 0.22, ease: EASE },
};

/**
 * Copies `value` (or the current URL) to the clipboard, with visible feedback:
 * the button turns green, a check draws itself and the label says it's copied.
 */
export function CopyButton({
  value,
  label,
  copiedLabel,
  variant = "pill",
}: {
  value?: string;
  label: string;
  copiedLabel: string;
  variant?: "pill" | "icon";
}) {
  const [copied, setCopied] = useState(0);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(0), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value ?? window.location.href);
      setCopied(Date.now());
    } catch {
      /* clipboard unavailable */
    }
  };

  if (variant === "icon") {
    return (
      <motion.button
        type="button"
        className={cn("icon-btn relative transition-colors duration-300", copied && "!border-success !bg-success !text-white")}
        aria-label={copied ? copiedLabel : label}
        onClick={copy}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={copied ? "done" : "idle"} className="inline-flex" {...swap}>
            {copied ? <DrawnCheck size={18} /> : <Link2 size={18} aria-hidden />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={copy}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative inline-flex min-h-11 cursor-pointer items-center overflow-hidden rounded-full border border-ink/18 bg-card px-4 text-sm font-medium transition-colors duration-300 hover:border-ink",
        copied && "border-success bg-success text-white hover:border-success",
      )}
    >
      {/* One soft flash when it's copied. */}
      <AnimatePresence>
        {copied ? (
          <motion.span
            key={copied}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white/35"
            initial={{ scale: 0.2, opacity: 0.7 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          />
        ) : null}
      </AnimatePresence>
      {/* Both labels stacked invisibly: the button keeps the width of the longer one. */}
      <span aria-hidden className="invisible grid">
        {[label, copiedLabel].map((t) => (
          <span key={t} className="col-start-1 row-start-1 inline-flex items-center gap-2 whitespace-nowrap">
            <span className="size-4" />
            {t}
          </span>
        ))}
      </span>
      <span aria-live="polite" className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={copied ? "done" : "idle"} className="inline-flex items-center gap-2 whitespace-nowrap" {...swap}>
            {copied ? <DrawnCheck /> : <Copy size={16} aria-hidden />}
            {copied ? copiedLabel : label}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
