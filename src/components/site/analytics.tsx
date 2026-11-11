"use client";

import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Sends one anonymous page view per route change. Respects Do Not Track. */
export function Analytics() {
  const pathname = usePathname();
  const locale = useLocale();
  const first = useRef(true);

  useEffect(() => {
    if (navigator.doNotTrack === "1" || process.env.NODE_ENV !== "production") return;
    // The referrer only means something for the page the visit started on.
    const referrer = first.current ? document.referrer : undefined;
    first.current = false;
    const payload = JSON.stringify({ path: pathname, locale, referrer });
    if (!navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "application/json" }))) {
      fetch("/api/track", { method: "POST", body: payload, keepalive: true }).catch(() => {});
    }
  }, [pathname, locale]);

  return null;
}
