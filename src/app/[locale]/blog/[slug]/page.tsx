import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { ComponentType } from "react";
import { PostCard } from "@/components/blog/post-card";
import { CopyButton } from "@/components/contact/copy-button";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { CtaFooter } from "@/components/site/site-footer";
import { Toc } from "@/components/site/toc";
import { getPost, posts } from "@/content/posts";
import { getProject, tones } from "@/content/projects";
import { site } from "@/content/site";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => posts.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const text = post.text[locale as Locale];
  return { title: text.title, description: text.excerpt };
}

async function loadBody(slug: string, locale: Locale): Promise<ComponentType | null> {
  try {
    return (await import(`@/content/blog/${slug}.${locale}.mdx`)).default;
  } catch {
    return null;
  }
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 11v5M8 8v.01M12 16v-5M16 16v-3a2 2 0 0 0-4 0" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M4 4l16 16M20 4 4 20" />
    </svg>
  );
}

export default async function PostPage({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const post = getPost(slug);
  if (!post) notFound();

  const t = await getTranslations("post");
  const blog = await getTranslations("blog");
  const cta = await getTranslations("cta");
  const format = await getFormatter();
  const text = post.text[locale];
  const Body = post.hasBody ? await loadBody(slug, locale) : null;
  const related = post.relatedProject ? getProject(post.relatedProject) : undefined;
  const more = posts.filter((p) => p.slug !== slug).slice(0, 3);
  const url = `${site.url}/${locale === "en" ? "" : "fr/"}blog/${slug}`;
  const category = blog(`categories.${post.category}.label`);

  return (
    <>
      <article>
        <header className="wrap flex flex-col gap-7 pb-14 pt-10">
          <nav aria-label={t("journal")} className="label flex items-center gap-2.5 text-muted-foreground">
            <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 hover:text-foreground">
              <ArrowLeft size={16} aria-hidden />
              {t("journal")}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-foreground">{category}</span>
          </nav>
          <Reveal className="flex max-w-[1040px] flex-col gap-7" y={16}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="label rounded-full bg-ink px-3 py-1.5 text-card">{category}</span>
              <span className="label text-muted-foreground">
                {format.dateTime(new Date(post.date), { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                {blog("minRead", { min: post.minutes })}
              </span>
            </div>
            <h1 className="m-0 font-display text-[clamp(40px,5.6vw,84px)] font-extrabold leading-none tracking-[-0.035em]">
              {text.title}
            </h1>
            <p className="m-0 max-w-[820px] text-[clamp(19px,1.7vw,23px)] leading-[1.55] text-muted-foreground">
              {text.excerpt}
            </p>
          </Reveal>
          <div className="hairline flex flex-wrap items-center justify-between gap-5 border-t pt-6">
            <div className="flex items-center gap-3.5">
              <span className="flex size-12 items-center justify-center rounded-full bg-blob-b font-bold" aria-hidden>
                PL
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">{site.name}</span>
                <span className="text-sm text-muted-foreground">{t("authorRole")}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="label mr-1.5 text-muted-foreground">{t("share")}</span>
              <CopyButton variant="icon" value={url} label={t("copyLink")} copiedLabel={t("linkCopied")} />
              <a
                className="icon-btn"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noreferrer"
                aria-label={t("shareLinkedIn")}
              >
                <LinkedInIcon />
              </a>
              <a
                className="icon-btn"
                href={`https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text.title)}`}
                target="_blank"
                rel="noreferrer"
                aria-label={t("shareX")}
              >
                <XIcon />
              </a>
            </div>
          </div>
        </header>

        <div className="wrap pb-[72px]">
          <Reveal
            className="flex aspect-[16/7] min-h-[300px] flex-col justify-between overflow-hidden rounded-[28px] p-[clamp(28px,4vw,56px)]"
            style={{ background: tones[post.tone].bg, color: tones[post.tone].ink }}
          >
            <span className="label">{category}</span>
            <span className="display whitespace-pre-line text-[clamp(64px,10vw,160px)] leading-[0.85]">
              {text.hook}
              <span className="text-card">.</span>
            </span>
          </Reveal>
        </div>

        <div className="wrap pb-28">
          <div className="flex flex-wrap items-start justify-center gap-16">
            {(text.toc || related) && (
              <aside className="sticky top-8 hidden flex-[0_1_240px] flex-col gap-8 nav:flex">
                {text.toc && Body && (
                  <Toc
                    variant="rail"
                    title={t("onThisPage")}
                    items={text.toc.map((label, i) => ({ id: `s${i + 1}`, label }))}
                  />
                )}
                {related && (
                  <div className="flex flex-col gap-2.5 rounded-[18px] bg-surface p-5">
                    <span className="label text-accent-ink">{t("related")}</span>
                    <Link href={`/work/${related.slug}`} className="display text-[22px] tracking-[-0.03em] hover:text-accent-ink">
                      {related.name} ↗
                    </Link>
                    <span className="text-sm leading-normal text-muted-foreground">{t("relatedBody")}</span>
                  </div>
                )}
              </aside>
            )}

            <div className="min-w-0 max-w-[700px] flex-[1_1_620px]">
              {Body ? (
                <div className="prose [&_h2]:scroll-mt-24">
                  <Body />
                </div>
              ) : (
                <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-ink/20 p-10">
                  <span className="display text-[40px]">{t("draftTitle")}</span>
                  <p className="m-0 text-lg leading-relaxed text-muted-foreground">{t("draftBody")}</p>
                  <Link href="/blog" className="btn btn-ghost">{t("allArticles")}</Link>
                </div>
              )}

              {post.tags && (
                <div className="hairline mt-12 flex flex-wrap gap-2 border-t pt-8">
                  {post.tags.map((tag) => (
                    <span key={tag} className="hairline inline-flex min-h-9 items-center rounded-full border bg-card px-3.5 text-[13px] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="hairline mt-10 flex flex-wrap items-start gap-5 rounded-3xl border bg-card p-7">
                <span className="flex size-16 flex-none items-center justify-center rounded-full bg-blob-b text-lg font-bold" aria-hidden>
                  PL
                </span>
                <div className="flex flex-[1_1_280px] flex-col gap-2.5">
                  <span className="label text-accent-ink">{t("writtenBy")}</span>
                  <span className="display text-2xl tracking-[-0.03em]">{site.name}</span>
                  <span className="text-[15px] leading-relaxed text-muted-foreground">{t("authorBio")}</span>
                  <div className="mt-1.5 flex flex-wrap gap-2.5">
                    <Link href="/contact" className="btn btn-primary">{t("workWithMe")}</Link>
                    <Link href="/about" className="btn btn-ghost">{t("about")}</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      <section className="bg-surface">
        <div className="wrap py-24">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <SplitHeadline text={t("keepReading")} className="text-[clamp(40px,5vw,72px)]" />
            <Link href="/blog" className="btn btn-ghost">{t("allArticles")}</Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-7">
            {more.map((p) => (
              <Reveal key={p.slug}>
                <PostCard post={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaFooter compact>
        <div className="flex flex-wrap items-center justify-between gap-8">
          <SplitHeadline text={t("enjoyed")} accent={cta("question")} className="text-[clamp(40px,5vw,72px)] text-background" />
          <div className="flex flex-wrap gap-3">
            <Link href="/blog" className="btn btn-light">{t("subscribeCta")}</Link>
            <Link href="/contact" className="btn btn-outline-dark">{t("startProject")}</Link>
          </div>
        </div>
      </CtaFooter>
    </>
  );
}

export const dynamicParams = false;
