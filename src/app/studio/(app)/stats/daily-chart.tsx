"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Day = { day: string; views: number; visitors: number };

const label = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", opts);

/**
 * Page views per day: one series, so no legend (the heading names it).
 * Hover or focus a day for its numbers; the table below is the text view.
 */
export function DailyChart({ days }: { days: Day[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.views));
  // A clean top for the scale: 1, 2, 5 × 10ⁿ.
  const step = 10 ** Math.floor(Math.log10(max));
  const top = [1, 2, 5, 10].map((m) => m * step).find((v) => v >= max) ?? max;
  const ticks = Number.isInteger(top / 2) ? [0, top / 2, top] : [0, top];
  const every = days.length > 31 ? 14 : days.length > 7 ? 7 : 1;
  const shown = active === null ? null : days[active];

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="flex min-h-12 items-end justify-between gap-4">
        <figcaption className="text-sm text-muted-foreground">Pages vues par jour</figcaption>
        <div aria-live="polite" className="text-right text-sm">
          {shown ? (
            <>
              <span className="font-semibold">{label(shown.day, { weekday: "long", day: "numeric", month: "long" })}</span>
              <span className="block text-muted-foreground">
                {shown.views} vue{shown.views > 1 ? "s" : ""} · {shown.visitors} visiteur{shown.visitors > 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Survolez un jour</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        {/* Y axis */}
        <div className="relative h-[220px] w-8 font-mono text-[11px] text-muted-foreground" aria-hidden>
          {ticks.map((v) => (
            <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: `${100 - (v / top) * 100}%` }}>
              {v}
            </span>
          ))}
        </div>
        <div className="relative h-[220px]" onMouseLeave={() => setActive(null)}>
          {ticks.map((v) => (
            <span key={v} aria-hidden className="absolute inset-x-0 border-t border-ink/8" style={{ top: `${100 - (v / top) * 100}%` }} />
          ))}
          <ol className="absolute inset-0 m-0 flex list-none items-end gap-[2px] p-0" aria-label="Pages vues par jour">
            {days.map((d, i) => (
              <li
                key={d.day}
                tabIndex={0}
                aria-label={`${label(d.day, { day: "numeric", month: "long" })} : ${d.views} vues, ${d.visitors} visiteurs`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="group flex h-full min-w-0 flex-1 cursor-default items-end outline-none"
              >
                <span
                  className={cn(
                    "block w-full rounded-t-[4px] transition-opacity",
                    d.views ? "bg-accent" : "",
                    active !== null && active !== i && "opacity-45",
                    "group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ink",
                  )}
                  style={{ height: `${(d.views / top) * 100}%`, minHeight: d.views ? 2 : 0 }}
                />
              </li>
            ))}
          </ol>
        </div>
        {/* X axis */}
        <span aria-hidden />
        <div className="relative mt-2 h-4 font-mono text-[11px] text-muted-foreground" aria-hidden>
          {days.map((d, i) =>
            (days.length - 1 - i) % every === 0 ? (
              <span key={d.day} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${((i + 0.5) / days.length) * 100}%` }}>
                {label(d.day, { day: "numeric", month: "short" })}
              </span>
            ) : null,
          )}
        </div>
      </div>
    </figure>
  );
}
