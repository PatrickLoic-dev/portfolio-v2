"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { EASE } from "@/components/motion/ease";
import { useLenis } from "@/components/motion/smooth-scroll";

export type ZoomLabels = { open: string; close: string };

const noop = () => () => {};

/**
 * An article image that grows to twice its size (within the screen) over a dark
 * backdrop. Clicking or tapping anywhere but the image, or Escape, puts it back.
 */
export function ZoomableImage({ src, alt, labels }: { src: string; alt: string; labels: ZoomLabels }) {
  const id = useId();
  const lenis = useLenis();
  const thumb = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState({ w: 0, ratio: 1 });
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  const show = () => {
    const img = thumb.current?.querySelector("img");
    if (!img) return;
    setSize({ w: img.getBoundingClientRect().width, ratio: img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 16 / 10 });
    setOpen(true);
  };
  const hide = () => setOpen(false);

  // While open: no page scroll, Escape closes, focus goes to the close button and comes back after.
  useEffect(() => {
    if (!open) return;
    const instance = lenis?.current;
    instance?.stop();
    document.documentElement.style.overflow = "hidden";
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const back = thumb.current;
    return () => {
      instance?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      back?.focus({ preventScroll: true });
    };
  }, [open, lenis]);

  // Twice the size it has in the article, but always fully on screen.
  const width = `min(${Math.round(size.w * 2)}px, 92vw, calc(88vh * ${size.ratio}))`;

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
        <motion.img
          layoutId={open ? undefined : id}
          src={src}
          alt={alt}
          loading="lazy"
          className="block w-full rounded-[18px]"
          style={{ opacity: open ? 0 : 1 }}
          transition={{ duration: 0.45, ease: EASE }}
        />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="zoom"
                role="dialog"
                aria-modal="true"
                aria-label={alt || labels.open}
                className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center"
                onClick={hide}
              >
                <motion.div
                  aria-hidden
                  className="absolute inset-0 bg-ink/85 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                />
                <motion.img
                  layoutId={id}
                  src={src}
                  alt={alt}
                  className="relative block h-auto cursor-default rounded-[18px] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)]"
                  style={{ width }}
                  transition={{ duration: 0.45, ease: EASE }}
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
                  onClick={hide}
                >
                  <X size={20} aria-hidden />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
