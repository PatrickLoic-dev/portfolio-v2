"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { EASE } from "@/components/motion/ease";
import { useLenis } from "@/components/motion/smooth-scroll";

export type ZoomLabels = { open: string; close: string };

type Box = { x: number; y: number; w: number; h: number };

const noop = () => () => {};
const DURATION = 0.5;

/** Where the enlarged image sits: twice its article size, centred, never larger than the screen. */
function target(from: Box, ratio: number): Box {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(from.w * 2, vw * 0.92, vh * 0.88 * ratio);
  const h = w / ratio;
  return { x: (vw - w) / 2, y: (vh - h) / 2, w, h };
}

/** The transform that makes the centred image look exactly like the one in the article. */
const fromBox = (start: Box, end: Box) => ({ x: start.x - end.x, y: start.y - end.y, scale: start.w / end.w });

/**
 * An article image that grows from its place to twice its size (within the screen)
 * over a dark backdrop. Clicking or tapping anywhere but the image, the close
 * button or Escape sends it back to where it was.
 */
export function ZoomableImage({ src, alt, labels }: { src: string; alt: string; labels: ZoomLabels }) {
  const lenis = useLenis();
  const thumb = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [zoom, setZoom] = useState<{ start: Box; end: Box } | null>(null);
  // Where to fly back to (measured again on close: the page may have moved).
  const [back, setBack] = useState<Box | null>(null);
  // The article image stays hidden until the enlarged one has landed back on it.
  const [away, setAway] = useState(false);
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  const rectOf = (): { box: Box; ratio: number } | null => {
    const img = thumb.current?.querySelector("img");
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return { box: { x: r.left, y: r.top, w: r.width, h: r.height }, ratio: r.width / r.height || 16 / 10 };
  };

  const show = () => {
    const m = rectOf();
    if (!m) return;
    // Decode first so the flying copy never shows up blank on its first frame.
    const copy = new Image();
    copy.src = src;
    copy
      .decode()
      .catch(() => {})
      .finally(() => {
        setBack(null);
        setZoom({ start: m.box, end: target(m.box, m.ratio) });
        setAway(true);
      });
  };
  const hide = () => {
    const m = rectOf();
    if (m) setBack(m.box);
    setZoom(null);
  };

  // While open: no page scroll, Escape closes, focus goes to the close button and comes back after.
  useEffect(() => {
    if (!zoom) return;
    const instance = lenis?.current;
    instance?.stop();
    document.documentElement.style.overflow = "hidden";
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const m = thumb.current?.querySelector("img")?.getBoundingClientRect();
      if (m) setBack({ x: m.left, y: m.top, w: m.width, h: m.height });
      setZoom(null);
    };
    window.addEventListener("keydown", onKey);
    const trigger = thumb.current;
    return () => {
      instance?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      trigger?.focus({ preventScroll: true });
    };
  }, [zoom, lenis]);

  return (
    <>
      <button
        ref={thumb}
        type="button"
        onClick={show}
        aria-label={alt ? `${labels.open} : ${alt}` : labels.open}
        aria-haspopup="dialog"
        className="my-8 block w-full cursor-zoom-in rounded-[18px] p-0 focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="block w-full rounded-[18px]" style={{ visibility: away ? "hidden" : "visible" }} />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence onExitComplete={() => setAway(false)}>
            {zoom && (
              <div key="zoom" role="dialog" aria-modal="true" aria-label={alt || labels.open} className="fixed inset-0 z-[60] cursor-zoom-out" onClick={hide}>
                <motion.div
                  aria-hidden
                  className="absolute inset-0 bg-ink/85 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: DURATION, ease: EASE }}
                />
                { }
                <motion.img
                  src={src}
                  alt={alt}
                  className="absolute block max-w-none cursor-default rounded-[18px] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)]"
                  style={{ left: zoom.end.x, top: zoom.end.y, width: zoom.end.w, height: zoom.end.h, originX: 0, originY: 0 }}
                  initial={fromBox(zoom.start, zoom.end)}
                  animate={{ x: 0, y: 0, scale: 1 }}
                  exit={fromBox(back ?? zoom.start, zoom.end)}
                  transition={{ duration: DURATION, ease: EASE }}
                  onClick={(e) => e.stopPropagation()}
                />
                <motion.button
                  ref={closeBtn}
                  type="button"
                  aria-label={labels.close}
                  className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-background/12 text-background hover:bg-background/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    hide();
                  }}
                >
                  <X size={20} aria-hidden />
                </motion.button>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
