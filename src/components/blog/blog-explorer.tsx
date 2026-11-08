"use client";

import { ArrowUpRight, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { EASE } from "@/components/motion/ease";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { categories, categoryTone, posts, type Category } from "@/content/posts";
import { tones } from "@/content/projects";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PostByline, PostCard } from "./post-card";

type Filter = "all" | Category;

export function BlogExplorer() {
  const t = useTranslations("blog");
  const types = useTranslations("types");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const [cat, setCat] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const featured = posts.find((p) => p.featured)!;
  const rest = posts.filter((p) => p !== featured);
  const query = q.trim().toLowerCase();

  const okCat = (c: Category, f: Filter) => f === "all" || c === f;
  const okQ = (slug: string) => {
    if (!query) return true;
    const p = posts.find((x) => x.slug === slug)!;
    return `${p.text[locale].title} ${p.text[locale].excerpt}`.toLowerCase().includes(query);
  };

  const shown = useMemo(
    () => rest.filter((p) => okCat(p.category, cat) && okQ(p.slug)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cat, query, locale],
  );
  const showFeatured = okCat(featured.category, cat) && !query;
  const countFor = (f: Filter) => posts.filter((p) => okCat(p.category, f)).length;
  const label = (f: Filter) => (f === "all" ? types("all") : t(`categories.${f}.label`));
  const reset = () => {
    setCat("all");
    setQ("");
  };

  return (
    <>
      <section className="wrap pb-14 pt-[clamp(48px,7vw,96px)]">
        <div className="flex flex-wrap items-end justify-between gap-10">
          <div className="flex flex-col gap-6">
            <span className="label text-accent-ink">{t("eyebrow", { count: posts.length })}</span>
            <SplitHeadline as="h1" immediate text={t("title")} accent="." className="text-[clamp(64px,11vw,168px)]" />
          </div>
          <Reveal delay={0.2} className="flex w-full max-w-[440px] flex-col gap-5">
            <p className="m-0 text-lg leading-relaxed text-muted-foreground">{t("intro")}</p>
            <label className="flex min-h-12 w-full items-center gap-2.5 rounded-full border border-ink/18 bg-card px-4 focus-within:border-ink focus-within:shadow-[0_0_0_4px_rgb(37_30_25/0.08)]">
              <Search size={18} className="text-muted-foreground" aria-hidden />
              <span className="sr-only">{t("search")}</span>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="min-h-11 w-full border-0 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground focus-visible:outline-none"
              />
            </label>
          </Reveal>
        </div>
      </section>

      <section className="wrap hairline border-y py-5" aria-label={t("filterSubject")}>
        <div
          className="no-scrollbar flex items-center gap-2 nav:flex-wrap max-nav:-mx-5 max-nav:w-[calc(100%+40px)] max-nav:overflow-x-auto max-nav:px-5"
          role="group"
          aria-label={t("subjects")}
        >
          <span className="label mr-2 flex-none text-muted-foreground max-nav:hidden">{t("subject")}</span>
          {(["all", ...categories] as Filter[]).map((f) => (
            <button key={f} type="button" className="pill" aria-pressed={cat === f} onClick={() => setCat(f)}>
              {label(f)} <span className="count">{countFor(f)}</span>
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence initial={false}>
        {showFeatured && (
          <motion.section
            key="featured"
            className="wrap pt-14"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <Link
              href={`/blog/${featured.slug}`}
              className="card-link hairline flex flex-wrap overflow-hidden rounded-[28px] border bg-card"
            >
              <div className="min-h-[420px] flex-[1_1_520px] overflow-hidden">
                <div
                  className="card-media flex h-full min-h-[420px] flex-col justify-between p-10"
                  style={{ background: tones[featured.tone].bg }}
                >
                  <span className="label">{t("featured")}</span>
                  <span className="display whitespace-pre-line text-[clamp(56px,7vw,112px)] leading-[0.85]">
                    {featured.text[locale].hook}
                    <span className="text-card">.</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-[1_1_420px] flex-col justify-between gap-6 p-[clamp(28px,4vw,56px)]">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="label rounded-full bg-ink px-3 py-1.5 text-card">
                      {t(`categories.${featured.category}.label`)}
                    </span>
                    <span className="label text-muted-foreground">
                      {format.dateTime(new Date(featured.date), { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                      {t("minRead", { min: featured.minutes })}
                    </span>
                  </div>
                  <h2 className="card-title heading text-[clamp(30px,3vw,44px)] leading-[1.08]">
                    {featured.text[locale].title}
                  </h2>
                  <p className="m-0 text-[17px] leading-[1.65] text-muted-foreground">{featured.text[locale].excerpt}</p>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <PostByline />
                  <span className="card-arrow inline-flex size-[52px] items-center justify-center rounded-full bg-ink text-card">
                    <ArrowUpRight size={20} aria-hidden />
                  </span>
                </div>
              </div>
            </Link>
          </motion.section>
        )}
      </AnimatePresence>

      <section className="wrap pb-28 pt-[72px]" aria-live="polite">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="display text-[clamp(36px,4vw,56px)]">{cat === "all" ? t("latest") : label(cat)}</h2>
          <span className="label text-muted-foreground">{t("count", { count: shown.length })}</span>
        </div>

        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-ink/20 px-6 py-20 text-center">
            <span className="display text-[40px]">{t("emptyTitle")}</span>
            <p className="m-0 text-muted-foreground">{t("emptyBody")}</p>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              {t("clear")}
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))] gap-x-7 gap-y-14">
            <AnimatePresence mode="popLayout">
              {shown.map((p, i) => (
                <motion.div
                  key={p.slug}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: i * 0.06 } }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
                >
                  <PostCard post={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <section className="bg-surface">
        <div className="wrap py-24">
          <div className="mb-10 flex flex-col gap-4">
            <span className="label text-accent-ink">{t("browse")}</span>
            <SplitHeadline text={t("subjects")} className="text-[clamp(44px,6vw,88px)]" />
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCat(c);
                  setQ("");
                  document.getElementById("content")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="hairline flex min-h-[180px] cursor-pointer flex-col justify-between gap-7 rounded-[20px] border bg-card p-6 text-left font-[inherit] transition-colors hover:bg-surface"
              >
                <span className="size-11 rounded-xl" style={{ background: tones[categoryTone[c]].bg }} />
                <span className="flex flex-col gap-1.5">
                  <span className="display text-2xl tracking-[-0.03em]">{t(`categories.${c}.label`)}</span>
                  <span className="text-sm leading-normal text-muted-foreground">{t(`categories.${c}.desc`)}</span>
                  <span className="label mt-1.5 text-muted-foreground">{t("count", { count: countFor(c) })}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
