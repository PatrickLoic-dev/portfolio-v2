"use client";

import { useAnimate } from "motion/react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navItems } from "@/components/site/nav-items";

/** Curtain timings (seconds): in, hold on the title, out. */
const IN = 0.55;
const OUT = 0.6;
const CURTAIN = [0.76, 0, 0.24, 1] as const;

/** "/fr/blog/x" → "/blog/x" */
const stripLocale = (path: string) => path.replace(/^\/(fr|en)(?=\/|$)/, "") || "/";

/**
 * Page transition: an espresso panel rises over the page with the name of the
 * destination, the route changes underneath, then the panel lifts away.
 * Internal links only; skipped with reduced motion, modifier keys and new tabs.
 */
export function PageTransition() {
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [title, setTitle] = useState("");
  // Visible (and blocking clicks) only while a transition runs.
  const [shown, setShown] = useState(false);
  const waiting = useRef<{ from: string; timer: number } | null>(null);
  const busy = useRef(false);

  const titleFor = (path: string) => {
    const p = stripLocale(path);
    const item = [...navItems].reverse().find((i) => (i.href === "/" ? p === "/" : p === i.href || p.startsWith(i.href + "/")));
    return item ? t(item.key) : "";
  };

  // Lift the panel once the new route is on screen.
  const reveal = async () => {
    const el = scope.current;
    if (!el) return;
    await animate(el.querySelector("[data-title]")!, { opacity: 0, y: -24 }, { duration: 0.3, ease: CURTAIN });
    await animate(el, { y: "-100%" }, { duration: OUT, ease: CURTAIN });
    setShown(false);
    busy.current = false;
  };

  useEffect(() => {
    const w = waiting.current;
    if (!w || w.from === pathname) return;
    window.clearTimeout(w.timer);
    waiting.current = null;
    // One frame for the new page to paint behind the panel.
    requestAnimationFrame(() => void reveal());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onClick = async (e: MouseEvent) => {
      if (busy.current || reduce.matches || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.noTransition !== undefined) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith("/studio") || url.pathname.startsWith("/api")) return;
      // Same page (or only a #hash change): let the browser handle it.
      if (url.pathname === window.location.pathname) return;

      e.preventDefault();
      busy.current = true;
      setTitle(titleFor(url.pathname));

      const el = scope.current!;
      setShown(true);
      const label = el.querySelector<HTMLElement>("[data-title]")!;
      await Promise.all([
        animate(el, { y: ["100%", "0%"] }, { duration: IN, ease: CURTAIN }),
        animate(label, { opacity: [0, 1], y: [40, 0] }, { duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }),
      ]);

      // If the route never changes (error, same page), don't leave the panel up.
      waiting.current = { from: window.location.pathname, timer: window.setTimeout(() => void reveal(), 4000) };
      router.push(url.pathname + url.search + url.hash);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={scope}
      aria-hidden
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink text-background"
      style={{ visibility: shown ? "visible" : "hidden", pointerEvents: shown ? "auto" : "none", transform: "translateY(100%)" }}
    >
      <span data-title className="display px-6 text-center text-[clamp(44px,9vw,136px)]" style={{ opacity: 0 }}>
        {title}
        <span className="text-accent">.</span>
      </span>
    </div>
  );
}
