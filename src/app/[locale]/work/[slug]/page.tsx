import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { RepoIcon } from "@/components/project/project-card";
import { TechList } from "@/components/tech";
import { ProjectMedia } from "@/components/project/project-media";
import { CtaFooter } from "@/components/site/site-footer";
import { Toc } from "@/components/site/toc";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPreviewProject, getPublicProject } from "@/lib/portfolio";
import { resolvePreview } from "@/lib/preview";
import { PreviewBanner } from "@/components/site/preview-banner";

export const dynamic = "force-dynamic";

/** The public project, or any project when a valid preview link opened it. */
async function load(slug: string, locale: Locale, token: string | string[] | undefined) {
  const previewId = await resolvePreview(token, "project");
  const draft = previewId ? await getPreviewProject(previewId, locale) : null;
  if (draft) return { project: draft, next: null, preview: true };
  const found = await getPublicProject(slug, locale);
  return found ? { ...found, preview: false } : null;
}

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/work/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = await load(slug, locale as Locale, (await searchParams).preview);
  if (!found) return {};
  const t = await getTranslations({ locale, namespace: "project" });
  return {
    title: t("metaTitle", { name: found.project.name }),
    description: found.project.description,
    ...(found.preview && { robots: { index: false, follow: false } }),
  };
}

export default async function ProjectPage({ params, searchParams }: PageProps<"/[locale]/work/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const found = await load(slug, locale, (await searchParams).preview);
  if (!found) notFound();
  const { project, next, preview } = found;

  const t = await getTranslations("project");
  const types = await getTranslations("types");
  const hasTitles = project.sections.some((s) => s.title.trim());

  const meta = [
    !project.personal && project.client && { label: t("client"), value: project.client },
    project.personal && { label: t("source"), value: project.openSource ? t("openSource") : t("closedSource") },
    { label: t("platform"), value: project.mobile ? t("mobile") : t("web") },
    project.tags.length > 0 && { label: t("stack"), value: <TechList names={project.tags} focusable /> },
    project.role ? { label: t("role"), value: project.role } : { label: t("type"), value: types(project.type) },
  ].filter(Boolean) as { label: string; value: ReactNode }[];

  return (
    <>
      {preview && <PreviewBanner />}
      <section className="wrap flex flex-col gap-8 pb-12 pt-10">
        <nav aria-label={t("breadcrumb")} className="label flex items-center gap-2.5 text-muted-foreground">
          <Link href={project.personal ? "/work#side-projects" : "/work"} className="inline-flex min-h-11 items-center gap-2 hover:text-foreground">
            <ArrowLeft size={16} aria-hidden />
            {project.personal ? t("allSide") : t("allProjects")}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground" aria-current="page">
            {project.n} · {project.name}
          </span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-10">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <span className="chip chip-ink">{types(project.type)}</span>
              {project.personal && <span className="chip">{project.openSource ? t("openSource") : t("closedSource")}</span>}
              {project.sector && <span className="chip">{project.sector}</span>}
            </div>
            <SplitHeadline as="h1" immediate text={project.name.replace(" ", "\n")} accent="." className="text-[clamp(40px,12vw,184px)]" />
          </div>
          {project.description && (
            <Reveal delay={0.2} as="p" className="m-0 max-w-[440px] flex-[1_1_320px] text-[19px] leading-[1.55]">
              {project.description}
            </Reveal>
          )}
        </div>

        <Stagger as="dl" className="hairline m-0 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] border-y">
          {meta.map((m, i) => (
            <StaggerItem key={m.label} className={`hairline flex flex-col gap-2 py-6 ${i === 0 ? "pr-6" : "border-l px-6"}`}>
              <dt className="label text-muted-foreground">{m.label}</dt>
              <dd className="m-0 font-semibold">{m.value}</dd>
            </StaggerItem>
          ))}
          {(project.url || project.repo) && (
            <StaggerItem className="hairline flex flex-col justify-center gap-2.5 border-l px-6 py-6">
              {project.url && (
                <a href={project.url} target="_blank" rel="noreferrer" className="btn btn-primary">
                  {t("visit")}
                  <ArrowUpRight size={16} aria-hidden />
                </a>
              )}
              {project.repo && (
                <a href={project.repo} target="_blank" rel="noreferrer" className={project.url ? "btn btn-ghost" : "btn btn-primary"}>
                  <RepoIcon url={project.repo} />
                  {t("viewCode")}
                  <ArrowUpRight size={16} aria-hidden />
                </a>
              )}
            </StaggerItem>
          )}
        </Stagger>
      </section>

      <section className="wrap pb-24">
        <Reveal className="overflow-hidden rounded-[28px]">
          <ProjectMedia project={project} size="hero" className="min-h-[260px] sm:aspect-[16/8] sm:min-h-[340px]" />
        </Reveal>
      </section>

      {project.sections.length > 0 && (
        <section className="wrap pb-30">
          <div className="flex flex-wrap items-start gap-16">
            <Toc
              title={t("onThisPage")}
              className="sticky top-8 hidden max-w-[260px] flex-[1_1_220px] nav:flex"
              items={[
                ...project.sections.map((s, i) => ({ id: s.key, label: t(s.key), index: `0${i + 1}` })),
                ...(project.media.length > 1 ? [{ id: "gallery", label: t("gallery"), index: `0${project.sections.length + 1}` }] : []),
              ]}
            />
            <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-24">
              {project.sections.map((s, i) => (
                <Reveal as="article" key={s.key} id={s.key} className="flex scroll-mt-24 flex-col gap-6">
                  <span className="label text-accent-ink">
                    0{i + 1} · {t(s.key)}
                  </span>
                  {s.title && <h2 className="heading max-w-[820px] text-[clamp(30px,3.4vw,48px)] leading-[1.1]">{s.title}</h2>}
                  {s.body && (
                    <p
                      className={
                        hasTitles
                          ? "m-0 max-w-[720px] whitespace-pre-line text-lg leading-[1.7] text-muted-foreground"
                          : "m-0 max-w-[820px] whitespace-pre-line text-[clamp(19px,1.6vw,22px)] leading-[1.65]"
                      }
                    >
                      {s.body}
                    </p>
                  )}
                  {s.key === "outcome" && project.metrics.length > 0 && (
                    <dl className="hairline m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] border-t">
                      {project.metrics.map((m, k) => (
                        <div key={k} className={`hairline flex flex-col-reverse gap-2 pt-7 ${k === 0 ? "pr-6" : "border-l px-6"}`}>
                          <dt className="label text-muted-foreground">{m.label}</dt>
                          <dd className="display m-0 text-[56px]">{m.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </Reveal>
              ))}

              {project.media.length > 1 && (
                <div id="gallery" className="grid scroll-mt-24 grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
                  {project.media.slice(1).map((src, i, all) => (
                    <Reveal
                      key={src}
                      className={`hairline overflow-hidden rounded-[22px] border bg-surface ${all.length % 2 === 1 && i === all.length - 1 ? "col-span-full" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`${project.name} ${i + 2}`} className="size-full object-cover" loading="lazy" />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <CtaFooter>
        {next ? (
          <Link href={`/work/${next.slug}`} className="group block text-background">
            <span className="label text-background/60">{t("next", { n: next.n })}</span>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
              <span className="display text-[clamp(40px,11vw,168px)] transition-colors duration-200 group-hover:text-blob-a">
                {next.name.split(" ").map((w, i) => (
                  <span key={i} className="block">
                    {w}
                  </span>
                ))}
              </span>
              <span className="inline-flex size-[88px] items-center justify-center rounded-full bg-background text-ink transition-transform duration-300 group-hover:translate-x-2">
                <ArrowRight size={32} strokeWidth={1.8} aria-hidden />
              </span>
            </div>
            {next.tags.length > 0 && <TechList names={next.tags} className="mt-6" />}
            <p className="mb-0 mt-4 max-w-[520px] text-[17px] leading-[1.55] text-background/70">{next.description}</p>
          </Link>
        ) : (
          <Link href="/work" className="btn btn-light">
            {t("allProjects")}
          </Link>
        )}
      </CtaFooter>
    </>
  );
}
