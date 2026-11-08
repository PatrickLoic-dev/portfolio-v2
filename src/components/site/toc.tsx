"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Item = { id: string; label: string; index?: string };

/** "On this page" nav with scroll-spy. */
export function Toc({
  items,
  title,
  variant = "numbered",
  className,
}: {
  items: Item[];
  title: string;
  variant?: "numbered" | "rail";
  className?: string;
}) {
  const [active, setActive] = useState(items[0]?.id);

  // Active = the last section whose top has passed the upper third of the viewport.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight / 3;
      let current = items[0]?.id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= line) current = item.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  if (variant === "rail") {
    return (
      <nav aria-label={title} className={cn("hairline border-l", className)}>
        <span className="label mb-2 block pl-4 text-muted-foreground">{title}</span>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={active === item.id ? "location" : undefined}
            className={cn(
              "-ml-px block border-l-2 py-2 pl-4 text-sm leading-snug transition-colors",
              active === item.id
                ? "border-accent font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label={title} className={cn("hairline flex flex-col gap-1 border-l pl-5", className)}>
      <span className="label mb-3 text-muted-foreground">{title}</span>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          aria-current={active === item.id ? "location" : undefined}
          className={cn(
            "flex min-h-10 items-center gap-3 text-[15px] transition-colors",
            active === item.id ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="label">{item.index}</span>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
