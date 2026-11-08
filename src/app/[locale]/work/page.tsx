import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SplitHeadline } from "@/components/motion/split-headline";
import { CtaFooter } from "@/components/site/site-footer";
import { SideProjects } from "@/components/work/side-projects";
import { WorkExplorer } from "@/components/work/work-explorer";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPublicProjects } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/work">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("work") };
}

export default async function WorkPage({ params }: PageProps<"/[locale]/work">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cta");
  const all = await getPublicProjects(locale as Locale);
  const personal = all.filter((p) => p.personal);

  return (
    <>
      <WorkExplorer projects={all.filter((p) => !p.personal)} />
      {personal.length > 0 && <SideProjects projects={personal} />}
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
