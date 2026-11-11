import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { robots: { index: false } };

const STATES = ["confirmed", "unsubscribed", "invalid"] as const;

export default async function NewsletterStatusPage({ params, searchParams }: PageProps<"/[locale]/newsletter">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("newsletter");
  const sp = await searchParams;
  const state = STATES.find((s) => s === sp.statut) ?? "invalid";

  return (
    <section className="wrap flex min-h-[60vh] flex-col justify-center gap-6 py-24">
      <Reveal className="flex max-w-[760px] flex-col gap-6">
        <span className="label text-accent-ink">{t("title")}</span>
        <h1 className="display m-0 text-[clamp(36px,5vw,64px)]">
          {t(state)}
          <span className="text-accent">.</span>
        </h1>
        <Link href="/blog" className="btn btn-ghost self-start">
          <ArrowLeft size={16} aria-hidden />
          {t("back")}
        </Link>
      </Reveal>
    </section>
  );
}
