import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BlogExplorer } from "@/components/blog/blog-explorer";
import { NewsletterForm } from "@/components/blog/newsletter";
import { SplitHeadline } from "@/components/motion/split-headline";
import { CtaFooter } from "@/components/site/site-footer";
import type { Locale } from "@/i18n/routing";
import { getPublicSubjects, getPublishedPosts } from "@/lib/notes";

// Read from the database on each request, so scheduled notes go live on time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("blog") };
}

export default async function BlogPage({ params }: PageProps<"/[locale]/blog">) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const [posts, subjects] = await Promise.all([getPublishedPosts(locale), getPublicSubjects(locale)]);

  return (
    <>
      <BlogExplorer posts={posts} subjects={subjects} />
      <CtaFooter>
        <div className="flex flex-wrap items-end justify-between gap-12">
          <div className="flex max-w-[640px] flex-col gap-5">
            <span className="label text-blob-a">{t("newsletter")}</span>
            <SplitHeadline text={t("newsletterTitle")} accent="." className="text-[clamp(36px,8vw,120px)] text-background" />
            <p className="m-0 text-[17px] leading-relaxed text-background/70">{t("newsletterBody")}</p>
          </div>
          <NewsletterForm />
        </div>
      </CtaFooter>
    </>
  );
}
