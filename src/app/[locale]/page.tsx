import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { ProjectFeature, ProjectTile } from "@/components/project/project-card";
import { WhatIDo } from "@/components/home/what-i-do";
import { SitemapFooter } from "@/components/site/site-footer";
import { Testimonial } from "@/components/site/testimonial";
import { site, stats, toolkit } from "@/content/site";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPublicProjects } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const nav = await getTranslations("nav");

  const projects = await getPublicProjects(locale as Locale);
  const [featured, ...rest] = projects.filter((p) => p.featured).slice(0, 5);
  const statValue = (key: (typeof stats)[number]["key"], value: string) => (key === "projects" ? String(projects.length) : value);

  return (
    <>
      {/* Hero */}
      <section className="wrap pb-16 pt-[clamp(40px,7vw,96px)]">
        <div className="flex flex-wrap items-end gap-12">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-8">
            <Reveal className="flex flex-wrap items-center gap-3" y={12}>
              <span className="label inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-2">
                <span className="size-2 rounded-full bg-success" />
                {nav("available")}
              </span>
              <span className="label text-muted-foreground">{t("role")}</span>
            </Reveal>
            <SplitHeadline as="h1" text={site.name.replace(" ", "\n")} accent="." immediate className="text-[clamp(76px,13.5vw,208px)]" />
            <Reveal delay={0.25}>
              <p className="m-0 max-w-[620px] text-[clamp(18px,1.6vw,22px)] leading-normal">
                {t.rich("bio", {
                  studio: (chunks) => (
                    <a href={site.studio.url} className="link-underline">
                      {chunks}
                    </a>
                  ),
                })}
              </p>
            </Reveal>
            <Reveal delay={0.35} className="flex flex-wrap gap-3">
              <Link href="/work" className="btn btn-primary">
                {t("viewWork")}
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="/contact" className="btn btn-ghost">
                {t("getInTouch")}
              </Link>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="flex max-w-[400px] flex-[1_1_300px] flex-col gap-3.5">
            <div className="hairline relative aspect-[4/5] overflow-hidden rounded-3xl border bg-surface">
              <Image
                src="/images/portrait.jpg"
                alt={t("portraitAlt")}
                fill
                priority
                sizes="(max-width: 860px) 100vw, 400px"
                className="object-cover"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="label text-muted-foreground">{t("scroll")}</span>
              <span className="label text-muted-foreground">{t("localTime")}</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Key figures */}
      <section className="wrap" aria-label={t("figures")}>
        <Stagger as="dl" className="hairline m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] border-y">
          {stats.map((s, i) => (
            <StaggerItem
              key={s.key}
              className={`hairline flex flex-col-reverse gap-2.5 py-8 ${i === 0 ? "pr-6" : "border-l px-6"}`}
            >
              <dt className="label text-muted-foreground">{t(`stats.${s.key}`)}</dt>
              <dd className="display m-0 text-[64px]">{statValue(s.key, s.value)}</dd>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Toolkit */}
      <section className="wrap flex flex-wrap items-center gap-2 py-10" aria-label={t("toolkit")}>
        <span className="label mr-3 text-muted-foreground">{t("toolkit")}</span>
        {toolkit.map((tool) => (
          <span key={tool} className="chip">
            {tool}
          </span>
        ))}
      </section>

      {/* Selected work */}
      <section className="wrap pb-16 pt-24">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-4">
            <span className="label text-accent-ink">{t("selectedEyebrow")}</span>
            <SplitHeadline text={t("selectedTitle")} className="text-[clamp(48px,7vw,104px)]" />
          </div>
          <Link href="/work" className="btn btn-ghost">
            {t("allProjects", { count: projects.length })}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        {featured && (
          <Reveal className="mb-14">
            <ProjectFeature project={featured} />
          </Reveal>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,520px),1fr))] gap-x-8 gap-y-14">
          {rest.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 2) * 0.08}>
              <ProjectTile project={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <WhatIDo />

      <Testimonial eyebrow={t("kindWords")} />

      {/* Let's talk + footer */}
      <footer className="bg-ink text-background">
        <div className="wrap pb-12 pt-32">
          <span className="label inline-flex items-center gap-2 text-blob-b">
            <span className="size-2 rounded-full bg-blob-b" />
            {t("openTo")}
          </span>
          <SplitHeadline
            as="h2"
            text={t("talkTitle")}
            accent="."
            className="mt-7 text-[clamp(72px,13vw,200px)] text-background"
          />
          <div className="mt-12 flex flex-wrap items-end justify-between gap-8">
            <p className="m-0 max-w-[460px] text-lg leading-[1.55] text-background/70">{t("talkBody")}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-light">
                {t("getInTouch")}
                <ArrowUpRight size={16} aria-hidden />
              </Link>
              <a href={`mailto:${site.email}`} className="btn btn-outline-dark">
                {site.email}
              </a>
            </div>
          </div>
          <SitemapFooter />
        </div>
      </footer>
    </>
  );
}
