import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { ProcessSteps } from "@/components/process/process-steps";
import { processSteps } from "@/content/process";
import { CtaFooter } from "@/components/site/site-footer";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: PageProps<"/[locale]/process">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("process") };
}

export default async function ProcessPage({ params }: PageProps<"/[locale]/process">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("process");

  return (
    <>
      <section className="wrap pb-20 pt-[clamp(48px,7vw,96px)]">
        <div className="flex flex-wrap items-end justify-between gap-10">
          <div className="flex flex-col gap-6">
            <span className="label text-accent-ink">{t("eyebrow")}</span>
            <SplitHeadline as="h1" immediate text={t("title")} accent="." className="text-[clamp(60px,10.5vw,160px)]" />
          </div>
          <Reveal delay={0.2} as="p" className="m-0 max-w-[440px] text-lg leading-relaxed text-muted-foreground">
            {t("intro")}
          </Reveal>
        </div>
      </section>

      <ProcessSteps />

      <section className="wrap pb-30">
        <div className="mb-10 flex flex-col gap-4">
          <span className="label text-accent-ink">{t("wholeEyebrow")}</span>
          <SplitHeadline text={t("wholeTitle")} className="text-[clamp(44px,6vw,88px)]" />
        </div>
        <Stagger as="ol" className="hairline m-0 list-none border-b p-0">
          {processSteps.map((s, i) => (
            <StaggerItem
              as="li"
              key={s.key}
              className="hairline grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] items-start gap-6 border-t py-9"
            >
              <div className="flex items-baseline gap-5">
                <span className="label text-accent-ink">0{i + 1}</span>
                <span className="display text-[clamp(30px,9vw,40px)]">{t(`items.${s.key}.title`)}</span>
              </div>
              <p className="m-0 text-base leading-[1.65] text-muted-foreground">{t(`items.${s.key}.desc`)}</p>
              <div className="flex flex-wrap content-start gap-1.5">
                {(t.raw(`items.${s.key}.points`) as string[]).map((p) => (
                  <span key={p} className={`inline-flex min-h-8 items-center rounded-full px-3 text-[13px] font-medium ${s.tone}`}>
                    {p}
                  </span>
                ))}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <CtaFooter>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="flex flex-col gap-5">
            <span className="label text-blob-a">{t("ctaEyebrow")}</span>
            <SplitHeadline text={t("ctaTitle")} accent="." className="text-[clamp(32px,9vw,136px)] text-background" />
          </div>
          <Link href="/contact" className="btn btn-light">
            {t("ctaButton")}
            <ArrowUpRight size={16} aria-hidden />
          </Link>
        </div>
      </CtaFooter>
    </>
  );
}
