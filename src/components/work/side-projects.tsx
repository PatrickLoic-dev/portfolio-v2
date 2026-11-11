"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EASE } from "@/components/motion/ease";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { SideProjectCard } from "@/components/project/project-card";
import type { PublicProject as Project } from "@/lib/portfolio";

type Source = "all" | "open" | "closed";

const matches = (p: Project, v: Source) => v === "all" || (v === "open") === p.openSource;

/** Work page: personal projects, filterable by open / closed source. */
export function SideProjects({ projects }: { projects: Project[] }) {
  const t = useTranslations("work");
  const types = useTranslations("types");
  const [source, setSource] = useState<Source>("all");
  const shown = projects.filter((p) => matches(p, source));
  const label = (v: Source) => (v === "all" ? types("all") : v === "open" ? t("openSource") : t("closedSource"));

  return (
    <section id="side-projects" className="wrap hairline scroll-mt-24 border-t pb-30 pt-[clamp(56px,8vw,112px)]">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="flex flex-col gap-6">
          <SplitHeadline as="h2" text={t("sideTitle")} accent="." className="text-[clamp(48px,8vw,120px)]" />
        </div>
        <Reveal delay={0.15}>
          <p className="m-0 max-w-[400px] text-[17px] leading-relaxed text-muted-foreground">{t("sideIntro")}</p>
        </Reveal>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-2" role="group" aria-label={t("filterSource")}>
        <span className="label mr-2 w-14 flex-none text-muted-foreground max-nav:hidden">{t("source")}</span>
        {(["all", "open", "closed"] as const).map((v) => (
          <button key={v} type="button" className="pill" aria-pressed={source === v} onClick={() => setSource(v)}>
            {label(v)} <span className="count">{projects.filter((p) => matches(p, v)).length}</span>
          </button>
        ))}
      </div>

      <div className="pt-12" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {shown.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="m-0 rounded-3xl border border-dashed border-ink/20 px-6 py-16 text-center text-muted-foreground"
            >
              {t("sideEmpty")}
            </motion.p>
          ) : (
            <motion.div
              key={source}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-x-7 gap-y-14"
            >
              {shown.map((p, i) => (
                <motion.div
                  key={p.slug}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, ease: EASE, delay: (i % 3) * 0.06 }}
                >
                  <SideProjectCard project={p} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
