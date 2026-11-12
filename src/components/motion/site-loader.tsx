"use client";

import { useAnimate } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { useLenis } from "./smooth-scroll";

const CURTAIN = [0.76, 0, 0.24, 1] as const;
const RISE = [0.22, 1, 0.36, 1] as const;
const KEY = "pl-loaded";

/**
 * Runs before first paint (in <head>): skips the loader when it already played
 * in this tab, or when the visitor prefers reduced motion. No flash either way.
 */
export const loaderGateScript = `try{if(sessionStorage.getItem("${KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("loader-done")}catch(e){}`;

/**
 * Entry loader, once per visit: an espresso curtain where three words burst in
 * the same spot, then the name rises with its terracotta dot, then the curtain lifts.
 */
export function SiteLoader() {
  const t = useTranslations("loader");
  const words = t.raw("words") as string[];
  const lenis = useLenis();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [gone, setGone] = useState(false);
  const [first, last] = site.name.split(" ");

  useEffect(() => {
    // Already played (or reduced motion): CSS keeps it hidden, nothing to run.
    if (document.documentElement.classList.contains("loader-done")) return;
    let cancelled = false;
    const instance = lenis?.current;
    instance?.stop();
    document.documentElement.style.overflow = "hidden";

    const finish = () => {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {}
      document.documentElement.classList.add("loader-done");
      document.documentElement.style.overflow = "";
      lenis?.current?.start();
      setGone(true);
    };

    (async () => {
      const root = scope.current;
      if (!root) return;
      const items = [...root.querySelectorAll<HTMLElement>("[data-word]")];
      await new Promise((r) => setTimeout(r, 150));
      // Words: each one rises into the slot while the previous one leaves upwards.
      for (let i = 0; i < items.length; i++) {
        if (cancelled) return;
        if (i > 0) void animate(items[i - 1], { y: ["0%", "-130%"] }, { duration: 0.42, ease: CURTAIN });
        await animate(items[i], { y: ["130%", "0%"] }, { duration: 0.42, ease: CURTAIN });
        await new Promise((r) => setTimeout(r, 170));
      }
      await animate(items[items.length - 1], { y: ["0%", "-130%"] }, { duration: 0.38, ease: CURTAIN });
      // Name, line by line, then the dot pops.
      const lines = [...root.querySelectorAll<HTMLElement>("[data-line]")];
      await Promise.all(lines.map((l, i) => animate(l, { y: ["105%", "0%"] }, { duration: 0.6, delay: i * 0.09, ease: RISE })));
      await animate(root.querySelector("[data-dot]")!, { scale: [0, 1.5, 1] }, { duration: 0.42 });
      await new Promise((r) => setTimeout(r, 380));
      // Curtain up.
      await animate(root, { y: "-100%" }, { duration: 0.8, ease: CURTAIN });
      if (!cancelled) finish();
    })();

    return () => {
      cancelled = true;
      document.documentElement.style.overflow = "";
      instance?.start();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div
      ref={scope}
      aria-hidden
      className="site-loader fixed inset-0 z-[90] flex flex-col justify-center bg-ink px-[clamp(20px,6vw,96px)] text-background"
    >
      <div className="relative">
        {/* Word slot, in the same spot as the first line of the name */}
        <div className="display absolute -top-[0.2em] left-0 h-[1.25em] w-full overflow-hidden pt-[0.2em] text-[clamp(44px,10vw,148px)]">
          {words.map((w) => (
            <span key={w} data-word className="absolute left-0 top-[0.2em] block" style={{ transform: "translateY(130%)" }}>
              {w}
            </span>
          ))}
        </div>
        {/* Name */}
        <div className="display text-[clamp(52px,12vw,176px)]">
          <span className="block overflow-hidden">
            <span data-line className="block" style={{ transform: "translateY(105%)" }}>
              {first}
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-line className="block" style={{ transform: "translateY(105%)" }}>
              {last}
              <span data-dot className="inline-block text-accent" style={{ transform: "scale(0)" }}>
                .
              </span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
