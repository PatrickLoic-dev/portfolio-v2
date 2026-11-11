"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { EASE } from "@/components/motion/ease";
import { Reveal } from "@/components/motion/reveal";
import type { Locale } from "@/i18n/routing";
import type { PublicTestimonial } from "@/lib/kind-words";
import { cn } from "@/lib/cn";

/** Time each quote stays on screen before sliding to the next. */
const INTERVAL = 7000;

/**
 * "Kind words": one large quote at a time that slides to the next on its own.
 * Pauses on hover, keyboard focus and hidden tabs; no autoplay with reduced motion.
 */
export function Testimonial({ eyebrow, items: testimonials }: { eyebrow: string; items: PublicTestimonial[] }) {
  const t = useTranslations("testimonial");
  const locale = useLocale() as Locale;
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const count = testimonials.length;
  const auto = count > 1 && !reduce;
  const paused = hovered || focused || hidden;

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // A fresh timer per slide, so a manual pick restarts the countdown.
  useEffect(() => {
    if (!auto || paused) return;
    const id = window.setTimeout(() => {
      setDir(1);
      setActive((i) => (i + 1) % count);
    }, INTERVAL);
    return () => window.clearTimeout(id);
  }, [auto, paused, active, count]);

  const go = (i: number) => {
    setDir(i >= active ? 1 : -1);
    setActive(i);
  };

  const current = testimonials[active];
  if (!current) return null;

  return (
    <section className="bg-surface" aria-label={eyebrow}>
      <div className="wrap flex flex-col gap-10 py-28">
        <Reveal
          className="flex flex-col gap-12"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
        >
          <div className="grid overflow-hidden" aria-live={auto && !paused ? "off" : "polite"}>
            <AnimatePresence initial={false} mode="popLayout" custom={dir}>
              <motion.figure
                key={current.id}
                id={`testimonial-${current.id}`}
                role="tabpanel"
                aria-labelledby={`testimonial-tab-${current.id}`}
                custom={dir}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 80 }),
                  center: { opacity: 1, x: 0 },
                  exit: (d: number) => ({ opacity: 0, x: d * -80 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: EASE }}
                className="m-0 [grid-area:1/1]"
              >
                <blockquote lang={locale} className="heading m-0 max-w-[1100px] text-[clamp(26px,3.4vw,48px)] leading-[1.14]">
                  <span className="text-accent">“</span>
                  {current.quote}
                  <span className="text-accent">”</span>
                </blockquote>
                <figcaption className="sr-only">
                  {current.name}, {current.role}, {current.company}
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          <div role="tablist" aria-label={t("choose")} className="flex flex-wrap gap-3">
            {testimonials.map((p, i) => {
              const on = i === active;
              return (
                <button
                  key={p.id}
                  id={`testimonial-tab-${p.id}`}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls={`testimonial-${p.id}`}
                  onClick={() => go(i)}
                  className={cn(
                    "relative flex min-h-11 items-center gap-4 overflow-hidden rounded-[30px] py-2 pl-2 pr-5 text-left transition-[background-color,opacity] duration-300",
                    on ? "bg-card shadow-sm" : "opacity-55 hover:opacity-100",
                  )}
                >
                  <span className={cn("flex size-[52px] flex-none items-center justify-center rounded-full font-bold", p.tone)} aria-hidden>
                    {p.initials}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {p.role} · {p.company}
                    </span>
                  </span>
                  {on && auto && (
                    <span
                      key={active}
                      aria-hidden
                      className="absolute inset-x-6 bottom-0 h-[3px] origin-left rounded-full bg-accent/70"
                      style={{
                        animation: `testimonial-progress ${INTERVAL}ms linear forwards`,
                        animationPlayState: paused ? "paused" : "running",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
