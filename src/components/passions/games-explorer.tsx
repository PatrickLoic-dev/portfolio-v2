"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { EASE } from "@/components/motion/ease";
import { games, platforms, type Platform } from "@/content/passions";
import { tones } from "@/content/projects";

type Sort = "pct" | "hours" | "recent";

export function GamesExplorer() {
  const t = useTranslations("passions");
  const [plat, setPlat] = useState<"all" | Platform>("all");
  const [sort, setSort] = useState<Sort>("pct");

  const list = useMemo(() => {
    const filtered = games.filter((g) => plat === "all" || g.platform === plat);
    return [...filtered].sort((a, b) =>
      sort === "pct" ? b.pct - a.pct : sort === "hours" ? b.hours - a.hours : a.lastPlayedDaysAgo - b.lastPlayedDaysAgo,
    );
  }, [plat, sort]);

  const last = (d: number) => (d < 30 ? t("last", { days: d }) : t("lastMonths", { months: Math.round(d / 30) }));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label={t("platform")} className="flex flex-wrap gap-2">
          {(["all", "steam", "ps"] as const).map((p) => (
            <button key={p} type="button" className="pill" aria-pressed={plat === p} onClick={() => setPlat(p)}>
              {p === "all" ? t("allGames") : platforms[p].name}{" "}
              <span className="count">{games.filter((g) => p === "all" || g.platform === p).length}</span>
            </button>
          ))}
        </div>
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
            <option value="pct">{t("sortPct")}</option>
            <option value="hours">{t("sortHours")}</option>
            <option value="recent">{t("sortRecent")}</option>
          </select>
        </div>
      </div>

      <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-5">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((g) => {
            const p = platforms[g.platform];
            const tone = tones[g.tone];
            const full = g.pct === 100;
            const unit = g.platform === "ps" ? t("trophies") : t("achievements");
            return (
              <motion.article
                key={g.name}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, ease: EASE }}
                whileHover={{ y: -4 }}
                className="hairline flex flex-col overflow-hidden rounded-[22px] border bg-card"
              >
                <div className="flex aspect-video flex-col justify-between p-4" style={{ background: tone.bg }}>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex min-h-[26px] items-center rounded-full px-2.5 text-xs font-semibold text-white" style={{ background: p.color }}>
                      {p.name}
                    </span>
                    {full && (
                      <span className="inline-flex min-h-[26px] items-center rounded-full bg-ink px-2.5 text-xs font-semibold text-white">
                        {g.platform === "ps" ? "Platinum" : "100 %"}
                      </span>
                    )}
                  </div>
                  <span className="display text-[26px]" style={{ color: tone.ink }}>
                    {g.name}
                  </span>
                </div>
                <div className="flex flex-col gap-3 p-[18px]">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">{unit}</span>
                    <span className="display text-[32px]">{g.pct}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${g.name} : ${g.pct}% ${unit.toLowerCase()}`}
                    aria-valuenow={g.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <motion.div
                      className={`h-2 rounded-full ${full ? "bg-success" : "bg-accent"}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${g.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: EASE }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-xs text-muted-foreground">
                    <span>{t("unlocked", { got: Math.round((g.pct / 100) * p.total), total: p.total })}</span>
                    <span>
                      {g.hours} h · {last(g.lastPlayedDaysAgo)}
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
