import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SplitHeadline } from "@/components/motion/split-headline";
import { CtaFooter } from "@/components/site/site-footer";
import { WorkExplorer } from "@/components/work/work-explorer";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: PageProps<"/[locale]/work">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("work") };
}

export default async function WorkPage({ params }: PageProps<"/[locale]/work">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cta");

  return (
    <>
      <WorkExplorer />
      <CtaFooter>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SplitHeadline text={t("gotProject")} accent={t("question")} className="text-[clamp(56px,9vw,136px)] text-background" />
          <Link href="/contact" className="btn btn-light">
            {t("getInTouch")}
            <ArrowUpRight size={16} aria-hidden />
          </Link>
        </div>
      </CtaFooter>
    </>
  );
}
