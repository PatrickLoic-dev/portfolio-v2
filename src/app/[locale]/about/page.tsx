import { ArrowUpRight, Download } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { CtaFooter } from "@/components/site/site-footer";
import { TechList } from "@/components/tech";
import { Testimonial } from "@/components/site/testimonial";
import { experiences, site, toolkitGroups } from "@/content/site";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPublicTestimonials } from "@/lib/kind-words";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("about") };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const nav = await getTranslations("nav");
  const home = await getTranslations("home");
  const process = await getTranslations("process");
  const cta = await getTranslations("cta");
  const format = await getFormatter();
  const testimonials = await getPublicTestimonials(locale);

  const month = (ym: string) => format.dateTime(new Date(`${ym}-01T00:00:00`), { month: "short", year: "numeric" });
  const years = experiences.flatMap((x) => [x.start, x.end]).map((d) => d.slice(0, 4)).sort();

  return (
    <>
      <section className="wrap flex flex-col gap-7 pb-20 pt-[clamp(48px,7vw,96px)]">
        <span className="label text-accent-ink">{t("eyebrow")}</span>
        <SplitHeadline as="h1" immediate text={t("title")} accent="." className="text-[clamp(56px,9.5vw,148px)]" />
      </section>

      <section className="wrap pb-30">
        <div className="flex flex-wrap items-start gap-14">
          <Reveal as="figure" className="m-0 flex max-w-[460px] flex-[1_1_320px] flex-col gap-3">
            <div className="hairline relative aspect-[4/5] overflow-hidden rounded-3xl border bg-surface">
              <Image src="/images/portrait.jpg" alt={home("portraitAlt")} fill sizes="(max-width: 860px) 100vw, 460px" className="object-cover" />
            </div>
            <figcaption className="label flex justify-between text-muted-foreground">
              <span>{site.name}</span>
              <span>{t("portraitCaption")}</span>
            </figcaption>
          </Reveal>

          <Reveal delay={0.1} className="flex min-w-0 flex-[999_1_520px] flex-col gap-10">
            <p className="heading m-0 text-[clamp(26px,2.8vw,40px)] leading-[1.15] tracking-[-0.02em]">{t("lead")}</p>
            <p className="m-0 max-w-[640px] text-lg leading-[1.7] text-muted-foreground">{t("bio")}</p>
            <dl className="hairline m-0 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] border-t">
              <div className="flex flex-col gap-2 pr-5 pt-6">
                <dt className="label text-muted-foreground">{t("role")}</dt>
                <dd className="m-0 font-semibold leading-snug">{t("roleValue")}</dd>
              </div>
              <div className="hairline flex flex-col gap-2 border-l px-5 pt-6">
                <dt className="label text-muted-foreground">{t("basedIn")}</dt>
                <dd className="m-0 font-semibold">{t("basedInValue")}</dd>
              </div>
              <div className="hairline flex flex-col gap-2 border-l px-5 pt-6">
                <dt className="label text-muted-foreground">{t("status")}</dt>
                <dd className="m-0 flex items-center gap-2 font-semibold">
                  <span className="size-2 rounded-full bg-success" />
                  {nav("available")}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-primary">{t("workWithMe")}</Link>
              <a href={site.cv[locale]} download className="btn btn-ghost">
                {t("downloadCv")}
                <Download size={16} aria-hidden />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Experience */}
      <section className="wrap pb-30">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-4">
            <span className="label text-accent-ink">{t("xpEyebrow")}</span>
            <SplitHeadline text={t("xpTitle")} className="text-[clamp(44px,6vw,88px)]" />
          </div>
          <span className="label text-muted-foreground">
            {years[0]} → {years[years.length - 1]}
          </span>
        </div>
        <Stagger as="ul" className="hairline m-0 list-none border-b p-0">
          {experiences.map((x, i) => (
            <StaggerItem
              as="li"
              key={x.company}
              className="hairline grid grid-cols-[48px_minmax(0,1fr)] items-baseline gap-6 border-t py-8 nav:grid-cols-[72px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]"
            >
              <span className="label text-muted-foreground">0{i + 1}</span>
              <div className="flex flex-col gap-1.5">
                <span className="heading text-[28px] tracking-[-0.02em]">{x.title[locale]}</span>
                <span className="text-muted-foreground">{x.company}</span>
              </div>
              <span className="col-start-2 flex flex-wrap gap-2 nav:col-start-auto">
                <span className="chip">{t(`xpTypes.${x.type}`)}</span>
                <span className="chip bg-secondary!">{t("months", { count: x.months })}</span>
              </span>
              <span className="label col-start-2 text-muted-foreground nav:col-start-auto">
                {month(x.start)} → {month(x.end)}
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Toolkit */}
      <section className="wrap pb-30">
        <div className="mb-10 flex flex-col gap-4">
          <span className="label text-accent-ink">{t("toolkitEyebrow")}</span>
          <SplitHeadline text={t("toolkitTitle")} className="text-[clamp(44px,6vw,88px)]" />
        </div>
        <Stagger className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {toolkitGroups.map((g) => (
            <StaggerItem key={g.key} className="hairline flex flex-col gap-5 rounded-[20px] border bg-card p-7">
              <span className="label text-accent-ink">{t(`groups.${g.key}`)}</span>
              <TechList names={g.items} focusable className="gap-2" />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Studio */}
      <section className="wrap pb-30">
        <Reveal>
          <a
            href={site.studio.url}
            className="group flex flex-wrap items-end justify-between gap-10 rounded-[28px] bg-blob-a p-[clamp(32px,5vw,64px)]"
          >
            <div className="flex max-w-[720px] flex-col gap-5">
              <span className="label">{t("studioEyebrow")}</span>
              <span className="display text-[clamp(44px,6.5vw,96px)]">{site.studio.name}</span>
              <p className="m-0 text-lg leading-relaxed">{t("studioBody")}</p>
            </div>
            <span className="inline-flex size-[72px] items-center justify-center rounded-full bg-ink text-card transition-transform duration-250 group-hover:-translate-y-1 group-hover:translate-x-1">
              <ArrowUpRight size={26} aria-hidden />
            </span>
          </a>
        </Reveal>
      </section>

      <Testimonial eyebrow={t("kindWords")} items={testimonials} />

      <CtaFooter>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SplitHeadline text={process("ctaTitle")} accent="." className="text-[clamp(56px,9vw,136px)] text-background" />
          <Link href="/contact" className="btn btn-light">
            {cta("getInTouch")}
            <ArrowUpRight size={16} aria-hidden />
          </Link>
        </div>
      </CtaFooter>
    </>
  );
}
