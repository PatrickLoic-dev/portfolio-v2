"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EASE } from "@/components/motion/ease";

/**
 * Remote Steam artwork with a fallback chain: tries each URL in turn and
 * renders nothing if all fail, so the tone background underneath shows.
 * Fades in once loaded.
 */
export function SteamImage({ srcs, alt = "", className }: { srcs: string[]; alt?: string; className?: string }) {
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // A server-rendered <img> can finish (or fail) before React attaches onLoad/onError: check on mount.
  useEffect(() => {
    const img = ref.current;
    if (!img?.complete) return;
    if (img.naturalWidth > 0) setLoaded(true);
    else setI((n) => n + 1);
  }, [i]);

  if (i >= srcs.length) return null;

  return (
    <motion.img
      ref={ref}
      key={srcs[i]}
      src={srcs[i]}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      initial={false}
      animate={{ opacity: loaded ? 1 : 0 }}
      style={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      onLoad={() => setLoaded(true)}
      onError={() => {
        setLoaded(false);
        setI((n) => n + 1);
      }}
    />
  );
}
