"use client";

import { LayoutGrid, List } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { EASE } from "@/components/motion/ease";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { ProjectCard, ProjectRow } from "@/components/project/project-card";
import type { PublicProject as Project } from "@/lib/portfolio";

type TypeFilter = "all" | Project["type"];

/** Wraps on desktop; on phones the pills scroll sideways edge-to-edge. */
const rowCls =
  "no-scrollbar flex items-center gap-2 nav:flex-wrap max-nav:-mx-5 max-nav:snap-x max-nav:overflow-x-auto max-nav:px-5 max-nav:w-[calc(100%+40px)]";

export function WorkExplorer({ projects }: { projects: Project[] }) {
  const t = useTranslations("work");
  const types = useTranslations("types");
  const [type, setType] = useState<TypeFilter>("all");
  const [tech, setTech] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Every technology in use becomes a filter, most used first.
  const technologies = useMemo(() => {
    const count = new Map<string, number>();
    projects.forEach((p) => p.tags.forEach((tag) => count.set(tag, (count.get(tag) ?? 0) + 1)));
    return [...count.entries()].filter(([, n]) => n >= 1).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }, [projects]);

  const okType = (p: Project, v: TypeFilter) => v === "all" || p.type === v;
  const okTech = (p: Project, v: string) => v === "all" || p.tags.includes(v);
  const shown = useMemo(
    () => projects.filter((p) => okType(p, type) && okTech(p, tech)),
    [projects, type, tech],
  );

  return (
    <>
      <section className="wrap pb-12 pt-[clamp(48px,7vw,96px)]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="flex flex-col gap-6">
            <span className="label text-accent-ink">{t("eyebrow", { count: shown.length, total: projects.length })}</span>
            <SplitHeadline as="h1" immediate text={t("title")} accent="." className="text-[clamp(64px,11vw,168px)]" />
          </div>
          <Reveal delay={0.2}>
            <p className="m-0 max-w-[400px] text-[17px] leading-relaxed text-muted-foreground">{t("intro")}</p>
          </Reveal>
        </div>
      </section>

      <section
        className="wrap hairline flex flex-col gap-2.5 border-y bg-background py-3 max-nav:sticky max-nav:top-[73px] max-nav:z-20 nav:gap-4 nav:py-6"
        aria-label={t("filters")}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className={rowCls} role="group" aria-label={t("filterType")}>
            <span className="label w-14 flex-none text-muted-foreground max-nav:hidden">{t("type")}</span>
            {(["all", "professional", "community"] as const).map((v) => (
              <button key={v} type="button" className="pill" aria-pressed={type === v} onClick={() => setType(v)}>
                {types(v)} <span className="count">{projects.filter((p) => okType(p, v) && okTech(p, tech)).length}</span>
              </button>
            ))}
          </div>
          <div className="hidden gap-2 nav:flex" role="group" aria-label={t("layout")}>
            <button type="button" className="icon-btn" aria-pressed={view === "grid"} aria-label={t("grid")} onClick={() => setView("grid")}>
              <LayoutGrid size={18} strokeWidth={1.8} aria-hidden />
            </button>
            <button type="button" className="icon-btn" aria-pressed={view === "list"} aria-label={t("list")} onClick={() => setView("list")}>
              <List size={18} strokeWidth={1.8} aria-hidden />
            </button>
          </div>
        </div>
        <div className={rowCls} role="group" aria-label={t("filterTech")}>
          <span className="label w-14 flex-none text-muted-foreground max-nav:hidden">{t("tech")}</span>
          {["all", ...technologies].map((v) => (
            <button key={v} type="button" className="pill" aria-pressed={tech === v} onClick={() => setTech(v)}>
              {v === "all" ? types("all") : v}{" "}
              <span className="count">{projects.filter((p) => okType(p, type) && okTech(p, v)).length}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="wrap pb-30 pt-14" aria-live="polite">
        <p className="sr-only">{t("eyebrow", { count: shown.length, total: projects.length })}</p>
        <AnimatePresence mode="wait" initial={false}>
          {shown.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-ink/20 px-6 py-24 text-center"
            >
              <span className="display text-[40px]">{t("emptyTitle")}</span>
              <p className="m-0 text-muted-foreground">{t("emptyBody")}</p>
              <button type="button" className="btn btn-ghost" onClick={() => { setType("all"); setTech("all"); }}>
                {t("reset")}
              </button>
            </motion.div>
          ) : view === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,400px),1fr))] gap-x-7 gap-y-14"
            >
              <AnimatePresence mode="popLayout">
                {shown.map((p, i) => (
                  <motion.div
                    key={p.slug}
                    layout
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: i * 0.06 } }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
                  >
                    <ProjectCard project={p} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="hairline border-b"
            >
              <AnimatePresence mode="popLayout">
                {shown.map((p, i) => (
                  <motion.div
                    key={p.slug}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay: i * 0.04 } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  >
                    <ProjectRow project={p} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
}
