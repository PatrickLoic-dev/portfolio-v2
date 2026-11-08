"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { EASE } from "@/components/motion/ease";
import { BrandIcon } from "@/components/brand-icon";
import { steamArt } from "@/lib/steam-art";
import { toneOf } from "@/lib/tones";
import { SteamImage } from "./steam-image";

export type PublicGame = {
  id: string;
  name: string;
  pct: number | null;
  unlocked: number | null;
  total: number | null;
  hours: number;
  daysAgo: number | null;
  tone: string;
  appId: number | null;
};

type Sort = "pct" | "hours" | "recent";

export function GamesExplorer({ games }: { games: PublicGame[] }) {
  const t = useTranslations("passions");
  const [sort, setSort] = useState<Sort>("hours");

  const list = useMemo(
    () =>
      [...games].sort((a, b) =>
        sort === "pct" ? (b.pct ?? -1) - (a.pct ?? -1) : sort === "hours" ? b.hours - a.hours : (a.daysAgo ?? 1e9) - (b.daysAgo ?? 1e9),
      ),
    [games, sort],
  );

  const last = (d: number | null) => (d === null ? "—" : d < 30 ? t("last", { days: d }) : t("lastMonths", { months: Math.round(d / 30) }));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="label text-muted-foreground">{t("gamesCount", { count: games.length })}</span>
        <div className="flex items-center gap-2.5">
          <label className="label text-muted-foreground" htmlFor="sort">
            {t("sort")}
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="min-h-11 rounded-full border border-ink/18 bg-card px-3.5 font-[inherit] text-sm"
          >
            <option value="hours">{t("sortHours")}</option>
            <option value="pct">{t("sortPct")}</option>
            <option value="recent">{t("sortRecent")}</option>
          </select>
        </div>
      </div>

      <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-5">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((g) => {
            const tone = toneOf(g.tone);
            const full = g.pct === 100;
            const art = steamArt(g.appId);
            return (
              <motion.article
                key={g.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, ease: EASE }}
                whileHover={{ y: -4 }}
                className="hairline flex flex-col overflow-hidden rounded-[22px] border bg-card"
              >
                <div className="relative flex aspect-[616/353] flex-col justify-between overflow-hidden p-4" style={{ background: tone.bg }}>
                  {/* The name shows on the tone panel until (or unless) the Steam cover loads over it. */}
                  <span className="display order-last text-[26px]" style={{ color: tone.ink }}>
                    {g.name}
                  </span>
                  {art && <SteamImage srcs={art.capsule} className="absolute inset-0 size-full object-cover" />}
                  <div className="relative flex items-center justify-between">
                    <span className="inline-flex min-h-[26px] items-center gap-1.5 rounded-full bg-[#1b2838] px-2.5 text-xs font-semibold text-white">
                      <BrandIcon brand="steam" size={12} /> Steam
                    </span>
                    {full && (
                      <span className="inline-flex min-h-[26px] items-center rounded-full bg-ink px-2.5 text-xs font-semibold text-white">100 %</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-[18px]">
                  {art && <h3 className="m-0 truncate text-base font-bold">{g.name}</h3>}
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">{t("achievements")}</span>
                    <span className="display text-[32px]">{g.pct === null ? "—" : `${g.pct}%`}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${g.name} : ${g.pct ?? 0}% ${t("achievements").toLowerCase()}`}
                    aria-valuenow={g.pct ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <motion.div
                      className={`h-2 rounded-full ${full ? "bg-success" : "bg-accent"}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${g.pct ?? 0}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: EASE }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-xs text-muted-foreground">
                    <span>{g.total ? t("unlocked", { got: g.unlocked ?? 0, total: g.total }) : t("noAchievements")}</span>
                    <span>
                      {g.hours} h · {last(g.daysAgo)}
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
