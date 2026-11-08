import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BlogExplorer } from "@/components/blog/blog-explorer";
import { NewsletterForm } from "@/components/blog/newsletter";
import { SplitHeadline } from "@/components/motion/split-headline";
import { CtaFooter } from "@/components/site/site-footer";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("blog") };
}

export default async function BlogPage({ params }: PageProps<"/[locale]/blog">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  return (
    <>
      <BlogExplorer />
      <CtaFooter>
        <div className="flex flex-wrap items-end justify-between gap-12">
          <div className="flex max-w-[640px] flex-col gap-5">
            <span className="label text-blob-a">{t("newsletter")}</span>
            <SplitHeadline text={t("newsletterTitle")} accent="." className="text-[clamp(52px,8vw,120px)] text-background" />
            <p className="m-0 text-[17px] leading-relaxed text-background/70">{t("newsletterBody")}</p>
          </div>
          <NewsletterForm />
        </div>
      </CtaFooter>
    </>
  );
}
