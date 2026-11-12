"use client";

import { X } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useLenis } from "@/components/motion/smooth-scroll";
import { isActive, navItems } from "@/components/site/nav-items";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const TONES: Record<(typeof navItems)[number]["key"], string> = {
  home: "var(--blob-a)",
  work: "var(--blob-b)",
  about: "var(--blob-c)",
  process: "var(--secondary)",
  passions: "var(--accent)",
  blog: "var(--surface)",
  contact: "var(--card)",
};

/** A tiny wireframe of a page, drawn on its layer. */
function Wire({ seed }: { seed: number }) {
  const rows = [70, 92, 54, 80, 64].map((w, i) => ((w + seed * 13 + i * 7) % 45) + 40);
  return (
    <span className="flex flex-col gap-1.5" aria-hidden>
      {rows.slice(0, 3).map((w, i) => (
        <span key={i} className="block h-1.5 rounded-full bg-ink/20" style={{ width: `${w}%` }} />
      ))}
      <span className="mt-1 flex gap-1.5">
        <span className="h-6 w-1/3 rounded-md bg-ink/15" />
        <span className="h-6 w-1/3 rounded-md bg-ink/15" />
        <span className="h-6 w-1/4 rounded-md bg-ink/25" />
      </span>
    </span>
  );
}

/**
 * Easter egg "noclip": the site comes apart into 3D layers, one per page,
 * like a debug view. Pick a layer to fly to that page. Escape closes.
 */
export function Noclip({ onClose }: { onClose: () => void }) {
  const t = useTranslations("nav");
  const s = useTranslations("secrets");
  const pathname = usePathname();
  const lenis = useLenis();
  const [hover, setHover] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const instance = lenis?.current;
    instance?.stop();
    document.documentElement.style.overflow = "hidden";
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setClosing(true);
    window.addEventListener("keydown", onKey);
    return () => {
      instance?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lenis]);

  const gap = 46;
  const n = navItems.length;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={s("noclipTitle")}
      className="fixed inset-0 z-[75] overflow-hidden bg-ink text-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={{ duration: 0.35 }}
      onAnimationComplete={() => closing && onClose()}
    >
      {/* Debug grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "linear-gradient(var(--card) 1px, transparent 1px), linear-gradient(90deg, var(--card) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />

      <div className="relative flex items-start justify-between gap-4 p-[clamp(16px,3vw,32px)]">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-blob-b">noclip · debug</span>
          <span className="display text-[clamp(28px,4vw,48px)]">
            {s("noclipTitle")}
            <span className="text-accent">.</span>
          </span>
          <span className="max-w-[340px] text-sm text-background/70">{s("noclipBody")}</span>
        </div>
        <button
          ref={closeBtn}
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full border border-background/25 hover:bg-background/10"
          aria-label={s("close")}
          onClick={() => setClosing(true)}
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      {/* The exploded stack */}
      <div className="absolute inset-x-0 bottom-0 top-[22%] flex items-center justify-center [perspective:1800px]">
        <motion.div
          className="relative h-[200px] w-[min(78vw,340px)] [transform-style:preserve-3d]"
          initial={{ rotateX: 0, rotateZ: 0, y: 40 }}
          animate={{ rotateX: 58, rotateZ: -32, y: n * gap * 0.35 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {navItems.map((item, i) => {
            const here = isActive(pathname, item.href);
            const lifted = hover === i;
            return (
              <motion.div
                key={item.href}
                className="absolute inset-0 [transform-style:preserve-3d]"
                initial={{ z: 0, opacity: 0 }}
                animate={{ z: i * gap, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 26, delay: closing ? 0 : 0.25 + i * 0.05 }}
              >
                {/* The link (click area) stays put; only the card drawn inside it lifts on hover. */}
                <Link
                  href={item.href}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  onClick={onClose}
                  aria-label={here ? `${t(item.key)} (${s("here")})` : t(item.key)}
                  className="absolute inset-0 rounded-2xl outline-none [transform-style:preserve-3d]"
                >
                  <motion.span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-0 flex flex-col justify-between rounded-2xl border-2 p-4 text-ink transition-[box-shadow,border-color] duration-200",
                      lifted ? "border-accent shadow-[0_0_0_4px_rgb(196_105_73/0.35)]" : "border-ink/30",
                    )}
                    style={{ background: TONES[item.key] }}
                    animate={{ z: lifted ? 22 : 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] opacity-70">layer_{String(i).padStart(2, "0")}</span>
                    </span>
                    <Wire seed={i} />
                    <span className="flex items-end justify-between gap-2">
                      <span className="display text-[26px]">
                        {t(item.key)}
                        <span className="text-accent">.</span>
                      </span>
                      {here && <span className="mb-1 rounded-full bg-ink px-2 py-0.5 font-mono text-[10px] uppercase text-background">{s("here")}</span>}
                    </span>
                  </motion.span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Name of the hovered layer, flat, readable */}
      <div aria-live="polite" className="pointer-events-none absolute bottom-[clamp(16px,4vw,40px)] left-1/2 -translate-x-1/2 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-background/60">
          {hover === null ? s("noclipHint") : `→ ${t(navItems[hover].key)}`}
        </span>
      </div>
    </motion.div>
  );
}
