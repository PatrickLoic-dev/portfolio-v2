"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** Copies `value` (or the current URL) to the clipboard. */
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value ?? window.location.href);
      setCopied(true);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (variant === "icon") {
    return (
      <button type="button" className="icon-btn" aria-label={copied ? copiedLabel : label} onClick={copy}>
        {copied ? <Check size={18} aria-hidden /> : <Link2 size={18} aria-hidden />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-ink/18 bg-card px-4 text-sm font-medium transition-colors hover:border-ink",
      )}
    >
      {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      {copied ? copiedLabel : label}
    </button>
  );
}
