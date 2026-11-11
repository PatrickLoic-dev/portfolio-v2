"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useRef, useState, type KeyboardEvent } from "react";
import { EASE } from "@/components/motion/ease";
import { processSteps } from "@/content/process";
import { cn } from "@/lib/cn";

/** Interactive stepper: tabs + animated panel. */
export function ProcessSteps() {
  const t = useTranslations("process");
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const n = processSteps.length;

  const go = (next: number, focus = false) => {
    const k = (next + n) % n;
    setDir(k > i || (i === n - 1 && k === 0) ? 1 : -1);
    setI(k);
    if (focus) tabs.current[k]?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(i + 1, true);
    if (e.key === "ArrowLeft") go(i - 1, true);
  };

  const cur = processSteps[i];
  const points = t.raw(`items.${cur.key}.points`) as string[];

  return (
    <section className="wrap pb-30" aria-label={t("steps")}>
      <div role="tablist" aria-label={t("steps")} onKeyDown={onKey} className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-1">
        {processSteps.map((s, k) => (
          <button
            key={s.key}
            ref={(el) => {
              tabs.current[k] = el;
            }}
            role="tab"
            id={`step-tab-${k}`}
            aria-selected={k === i}
            aria-controls="step-panel"
            tabIndex={k === i ? 0 : -1}
            onClick={() => go(k)}
            className={cn(
              "relative flex min-h-11 cursor-pointer flex-col items-start gap-3.5 border-0 border-t-[3px] border-ink/12 bg-transparent px-5 pb-7 pt-6 text-left font-[inherit] transition-colors duration-250",
              k === i ? "bg-card text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground",
            )}
          >
            {k === i && (
              <motion.span
                layoutId="step-indicator"
                className="absolute inset-x-0 -top-[3px] h-[3px] bg-accent"
                transition={{ duration: 0.4, ease: EASE }}
              />
            )}
            <span className="label">{`0${k + 1}`} / 05</span>
            <span className="display text-[clamp(16px,4.6vw,26px)] leading-none tracking-[-0.03em]">{t(`items.${s.key}.title`)}</span>
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="step-panel"
        aria-labelledby={`step-tab-${i}`}
        className="hairline mt-6 overflow-hidden rounded-[28px] border bg-card p-[clamp(28px,5vw,64px)]"
      >
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={cur.key}
            custom={dir}
            initial={{ opacity: 0, x: 32 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 * dir, transition: { duration: 0.18 } }}
            transition={{ duration: 0.35, ease: EASE }}
            className="flex flex-wrap gap-12"
          >
            <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-7">
              <div className="flex flex-wrap items-baseline gap-5">
                <span className="display text-[clamp(88px,12vw,176px)] text-accent">{`0${i + 1}`}</span>
                <span className="display text-[clamp(36px,4.5vw,64px)]">{t(`items.${cur.key}.title`)}</span>
              </div>
              <p className="m-0 max-w-[620px] text-xl leading-relaxed">{t(`items.${cur.key}.desc`)}</p>
              <div className="mt-auto flex gap-2.5">
                <button type="button" className="icon-btn size-12!" aria-label={t("prev")} onClick={() => go(i - 1)}>
                  <ArrowLeft size={18} aria-hidden />
                </button>
                <button type="button" className="icon-btn size-12!" aria-label={t("next")} onClick={() => go(i + 1)}>
                  <ArrowRight size={18} aria-hidden />
                </button>
              </div>
            </div>
            <div className={cn("flex flex-[1_1_320px] flex-col gap-1 rounded-[20px] p-7", cur.tone)}>
              <span className="label mb-3">{t("whatYouGet")}</span>
              {points.map((p, k) => (
                <motion.div
                  key={p}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE, delay: 0.1 + k * 0.06 }}
                  className="flex items-start gap-3.5 border-t border-ink/14 py-3.5"
                >
                  <Check size={20} className="mt-0.5 flex-none" aria-hidden />
                  <span className="text-base font-medium leading-[1.45]">{p}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
