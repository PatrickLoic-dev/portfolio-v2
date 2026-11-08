"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, type ReactNode, type RefObject } from "react";

const LenisContext = createContext<RefObject<Lenis | null> | null>(null);

/** Ref to the running Lenis instance (null when reduced motion is on). */
export function useLenis() {
  return useContext(LenisContext);
}

/** Lenis smooth scroll — skipped entirely when the user prefers reduced motion. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenis = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      anchors: { offset: -24 },
    });
    lenis.current = instance;

    let raf = 0;
    const loop = (time: number) => {
      instance.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      instance.destroy();
      lenis.current = null;
    };
  }, []);

  // New page → start at the top, or at the #anchor when the URL has one.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target) {
      lenis.current?.scrollTo(0, { immediate: true });
      return;
    }
    // Jump now, then once more after the page has settled (cards and media
    // above the anchor can still shift the layout right after navigation).
    const go = () => lenis.current?.scrollTo(target, { offset: -24, immediate: true });
    go();
    const settle = window.setTimeout(() => {
      lenis.current?.resize();
      go();
    }, 400);
    return () => window.clearTimeout(settle);
  }, [pathname]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
