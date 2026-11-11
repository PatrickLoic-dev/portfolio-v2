"use client";

import { geoEqualEarth, geoPath } from "d3-geo";
import countriesCodes from "i18n-iso-countries";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useMemo, useRef, useState, type PointerEvent } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { cn } from "@/lib/cn";

export type CountryRow = { country: string | null; views: number; visitors: number };

const W = 960;
const H = 500;
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

const regionNames = new Intl.DisplayNames(["fr"], { type: "region" });
const nameOf = (alpha2: string) => {
  try {
    return regionNames.of(alpha2) ?? alpha2;
  } catch {
    return alpha2;
  }
};

/** Countries shapes, projected once. */
const SHAPES = (() => {
  const topo = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
  const geo = feature(topo, topo.objects.countries);
  const projection = geoEqualEarth().fitExtent(
    [
      [8, 8],
      [W - 8, H - 8],
    ],
    geo,
  );
  const path = geoPath(projection);
  return geo.features
    .filter((f) => f.properties?.name !== "Antarctica")
    .map((f) => ({ id: f.id == null ? null : String(f.id).padStart(3, "0"), name: f.properties?.name ?? "", d: path(f) ?? "" }));
})();

/**
 * One hue, light to dark (sequential): the more views, the deeper the terracotta.
 * A square-root scale keeps a country with a handful of views visible next to a big one.
 */
const fill = (views: number, max: number) =>
  views ? `color-mix(in oklab, var(--accent-ink) ${Math.round(18 + 82 * Math.sqrt(views / max))}%, var(--card))` : "var(--muted)";

/** Visits per country: hover or focus a country, drag to move, buttons to zoom. */
export function WorldMap({ rows }: { rows: CountryRow[] }) {
  const known = rows.filter((r) => r.country);
  const unknown = rows.find((r) => !r.country);
  const total = rows.reduce((n, r) => n + r.views, 0);
  const max = Math.max(1, ...known.map((r) => r.views));

  // numeric ISO code (map ids) → stats row
  const byNumeric = useMemo(() => {
    const m = new Map<string, CountryRow & { country: string }>();
    for (const r of known) {
      const num = countriesCodes.alpha2ToNumeric(r.country!);
      if (num) m.set(num, r as CountryRow & { country: string });
    }
    return m;
  }, [known]);

  const [active, setActive] = useState<{ id: string; x: number; y: number } | null>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const clamp = (v: { k: number; x: number; y: number }) => {
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.k));
    // Keep the map on screen.
    const minX = W - W * k;
    const minY = H - H * k;
    return { k, x: Math.min(0, Math.max(minX, v.x)), y: Math.min(0, Math.max(minY, v.y)) };
  };
  const zoomBy = (f: number) =>
    setView((v) => {
      const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.k * f));
      // Zoom around the centre of the frame.
      const cx = W / 2;
      const cy = H / 2;
      return clamp({ k, x: cx - ((cx - v.x) / v.k) * k, y: cy - ((cy - v.y) / v.k) * k });
    });

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = box.current?.getBoundingClientRect();
    if (drag.current && rect && view.k > 1) {
      const scale = W / rect.width;
      const dx = (e.clientX - drag.current.x) * scale;
      const dy = (e.clientY - drag.current.y) * scale;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        drag.current.moved = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      setView((v) => clamp({ ...v, x: drag.current!.vx + dx, y: drag.current!.vy + dy }));
    }
  };
  const onUp = () => {
    drag.current = null;
  };

  const tip = active && SHAPES.find((s) => s.id === active.id);
  const tipRow = active ? byNumeric.get(active.id) : undefined;
  const ranked = [...known].sort((a, b) => b.views - a.views);

  return (
    <section className="hairline flex flex-col gap-5 rounded-[20px] border bg-card p-6" aria-labelledby="map-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="map-title" className="m-0 text-lg font-bold">
            D&apos;où viennent les visites
          </h2>
          <p className="m-0 text-[13px] text-muted-foreground">
            {known.length
              ? `${known.length} pays · survolez un pays pour le détail, glissez pour vous déplacer après un zoom.`
              : "Le pays est enregistré pour les nouvelles visites du site en ligne."}
          </p>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Zoom de la carte">
          <button type="button" className="icon-btn size-9" aria-label="Zoom avant" onClick={() => zoomBy(1.6)} disabled={view.k >= MAX_ZOOM}>
            <Plus size={16} aria-hidden />
          </button>
          <button type="button" className="icon-btn size-9" aria-label="Zoom arrière" onClick={() => zoomBy(1 / 1.6)} disabled={view.k <= MIN_ZOOM}>
            <Minus size={16} aria-hidden />
          </button>
          <button type="button" className="icon-btn size-9" aria-label="Recentrer la carte" onClick={() => setView({ k: 1, x: 0, y: 0 })} disabled={view.k === 1}>
            <RotateCcw size={15} aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div ref={box} className="relative min-w-0 flex-[999_1_560px]" onMouseLeave={() => setActive(null)}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={
              ranked.length
                ? `Carte des visites par pays. En tête : ${ranked
                    .slice(0, 3)
                    .map((r) => `${nameOf(r.country!)} ${r.views}`)
                    .join(", ")}.`
                : "Carte des visites par pays : aucune donnée pour l'instant."
            }
            className={cn("block h-auto w-full touch-none select-none rounded-xl bg-background", view.k > 1 && "cursor-grab active:cursor-grabbing")}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
              {SHAPES.map((s, i) => {
                const row = s.id ? byNumeric.get(s.id) : undefined;
                const on = active?.id === s.id;
                return (
                  <path
                    key={`${s.id ?? "x"}-${i}`}
                    d={s.d}
                    fill={fill(row?.views ?? 0, max)}
                    stroke={on ? "var(--foreground)" : "var(--card)"}
                    strokeWidth={on ? 1.4 : 0.5}
                    vectorEffect="non-scaling-stroke"
                    className="transition-[fill] duration-300"
                    tabIndex={row ? 0 : -1}
                    aria-label={row ? `${nameOf(row.country)} : ${row.views} vues` : undefined}
                    onPointerEnter={(e) => {
                      if (!s.id || drag.current?.moved) return;
                      const rect = box.current!.getBoundingClientRect();
                      setActive({ id: s.id, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onPointerMove={(e) => {
                      if (!s.id || drag.current?.moved) return;
                      const rect = box.current!.getBoundingClientRect();
                      setActive({ id: s.id, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onFocus={(e) => {
                      if (!s.id) return;
                      const r = (e.target as SVGPathElement).getBoundingClientRect();
                      const rect = box.current!.getBoundingClientRect();
                      setActive({ id: s.id, x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 });
                    }}
                    onBlur={() => setActive(null)}
                  />
                );
              })}
            </g>
          </svg>

          {tip && (
            <div
              role="status"
              className="pointer-events-none absolute z-10 min-w-[150px] -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-xl bg-ink px-3.5 py-2.5 text-background shadow-lg"
              style={{ left: active!.x, top: active!.y }}
            >
              <span className="block text-sm font-semibold">{tipRow ? nameOf(tipRow.country) : tip.name}</span>
              {tipRow ? (
                <span className="block text-[13px] text-background/80">
                  {tipRow.views} vue{tipRow.views > 1 ? "s" : ""} · {tipRow.visitors} visiteur{tipRow.visitors > 1 ? "s" : ""} ·{" "}
                  {Math.round((tipRow.views / Math.max(1, total)) * 100)} %
                </span>
              ) : (
                <span className="block text-[13px] text-background/70">Aucune visite</span>
              )}
            </div>
          )}

          {/* Legend: the colour scale. */}
          <div className="mt-3 flex items-center gap-2.5 text-xs text-muted-foreground" aria-hidden>
            <span>0</span>
            <span
              className="h-2 w-40 rounded-full"
              style={{ background: "linear-gradient(90deg, color-mix(in oklab, var(--accent-ink) 18%, var(--card)), var(--accent-ink))" }}
            />
            <span>
              {max} vue{max > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* The same data as a list (readable without the map). */}
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
          <span className="label mb-1 flex justify-between text-muted-foreground">
            <span>Pays</span>
            <span>Vues</span>
          </span>
          {ranked.length === 0 && !unknown && <p className="m-0 py-6 text-center text-sm text-muted-foreground">Aucune visite sur cette période.</p>}
          <ol className="m-0 flex list-none flex-col gap-1 p-0">
            {ranked.slice(0, 10).map((r) => {
              const num = countriesCodes.alpha2ToNumeric(r.country!);
              return (
                <li
                  key={r.country}
                  className={cn("relative flex min-h-9 items-center justify-between gap-3 overflow-hidden rounded-lg px-3", active?.id === num && "ring-1 ring-ink")}
                >
                  <span aria-hidden className="absolute inset-y-0 left-0 rounded-lg bg-accent/14" style={{ width: `${(r.views / max) * 100}%` }} />
                  <span className="relative truncate text-sm font-medium">{nameOf(r.country!)}</span>
                  <span className="relative font-mono text-sm">{r.views}</span>
                </li>
              );
            })}
            {unknown && (
              <li className="flex min-h-9 items-center justify-between gap-3 px-3 text-sm text-muted-foreground">
                <span>Pays inconnu</span>
                <span className="font-mono">{unknown.views}</span>
              </li>
            )}
          </ol>
        </div>
      </div>
    </section>
  );
}
