import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { ProjectMedia } from "@/components/project/project-media";
import { CtaFooter } from "@/components/site/site-footer";
import { Toc } from "@/components/site/toc";
import { getNextProject, getProject, projects } from "@/content/projects";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => projects.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/work/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const t = await getTranslations({ locale, namespace: "project" });
  return {
    title: t("metaTitle", { name: project.name }),
    description: project.content[locale as Locale].description,
  };
}

const sections = ["problem", "approach", "outcome"] as const;

export default async function ProjectPage({ params }: PageProps<"/[locale]/work/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const project = getProject(slug);
  if (!project) notFound();

  const t = await getTranslations("project");
  const types = await getTranslations("types");
  const text = project.content[locale];
  const extra = project.extras?.[locale];
  const next = getNextProject(slug);

  const meta = [
    project.client && { label: t("client"), value: project.client },
    { label: t("platform"), value: project.mobile ? t("mobile") : t("web") },
    { label: t("stack"), value: project.tags.join(" · ") },
    { label: t("type"), value: types(project.type) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      <section className="wrap flex flex-col gap-8 pb-12 pt-10">
        <nav aria-label={t("breadcrumb")} className="label flex items-center gap-2.5 text-muted-foreground">
          <Link href="/work" className="inline-flex min-h-11 items-center gap-2 hover:text-foreground">
            <ArrowLeft size={16} aria-hidden />
            {t("allProjects")}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground" aria-current="page">
            {project.n} — {project.name}
          </span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-10">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <span className="chip chip-ink">{types(project.type)}</span>
              {extra?.sector && <span className="chip">{extra.sector}</span>}
            </div>
            <SplitHeadline
              as="h1"
              immediate
              text={project.name.replace(" ", "\n")}
              accent="."
              className="text-[clamp(64px,12vw,184px)]"
            />
          </div>
          <Reveal delay={0.2} as="p" className="m-0 max-w-[440px] flex-[1_1_320px] text-[19px] leading-[1.55]">
            {text.description}
          </Reveal>
        </div>

        <Stagger as="dl" className="hairline m-0 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] border-y">
          {meta.map((m, i) => (
            <StaggerItem key={m.label} className={`hairline flex flex-col gap-2 py-6 ${i === 0 ? "pr-6" : "border-l px-6"}`}>
              <dt className="label text-muted-foreground">{m.label}</dt>
              <dd className="m-0 font-semibold">{m.value}</dd>
            </StaggerItem>
          ))}
          {project.url && (
            <StaggerItem className="hairline flex flex-col justify-center border-l px-6 py-6">
              <a href={project.url} target="_blank" rel="noreferrer" className="btn btn-primary">
                {t("visit")}
                <ArrowUpRight size={16} aria-hidden />
              </a>
            </StaggerItem>
          )}
        </Stagger>
      </section>

      <section className="wrap pb-24">
        <Reveal className="overflow-hidden rounded-[28px]">
          <ProjectMedia project={project} size="hero" className="aspect-[16/8] min-h-[340px]" />
        </Reveal>
      </section>

      <section className="wrap pb-30">
        <div className="flex flex-wrap items-start gap-16">
          <Toc
            title={t("onThisPage")}
            className="sticky top-8 hidden max-w-[260px] flex-[1_1_220px] nav:flex"
            items={sections.map((s, i) => ({ id: s, label: t(s), index: `0${i + 1}` }))}
          />
          <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-24">
            {sections.map((s, i) => (
              <Reveal as="article" key={s} id={s} className="flex scroll-mt-24 flex-col gap-6">
                <span className="label text-accent-ink">
                  0{i + 1} — {t(s)}
                </span>
                {extra?.headlines && (
                  <h2 className="heading max-w-[820px] text-[clamp(30px,3.4vw,48px)] leading-[1.1]">{extra.headlines[s]}</h2>
                )}
                <p
                  className={
                    extra?.headlines
                      ? "m-0 max-w-[720px] text-lg leading-[1.7] text-muted-foreground"
                      : "m-0 max-w-[820px] text-[clamp(19px,1.6vw,22px)] leading-[1.65]"
                  }
                >
                  {text[s]}
                </p>
                {s === "approach" && extra?.highlights && (
                  <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                    {extra.highlights.map((h) => (
                      <div key={h.label} className="hairline flex flex-col gap-2.5 rounded-[18px] border bg-card p-6">
                        <span className="label text-accent-ink">{h.label}</span>
                        <span className="text-[17px] font-semibold">{h.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaFooter>
        <Link href={`/work/${next.slug}`} className="group block text-background">
          <span className="label text-background/60">{t("next", { n: next.n })}</span>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <span className="display text-[clamp(64px,11vw,168px)] transition-colors duration-200 group-hover:text-blob-a">
              {next.name.split(" ").map((w, i) => (
                <span key={i} className="block">{w}</span>
              ))}
            </span>
            <span className="inline-flex size-[88px] items-center justify-center rounded-full bg-background text-ink transition-transform duration-300 group-hover:translate-x-2">
              <ArrowRight size={32} strokeWidth={1.8} aria-hidden />
            </span>
          </div>
          <p className="mb-0 mt-6 max-w-[520px] text-[17px] leading-[1.55] text-background/70">
            {next.tags.join(" · ")} — {next.content[locale].description}
          </p>
        </Link>
      </CtaFooter>
    </>
  );
}
