import { ArrowUpRight, Mail } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BrandIcon } from "@/components/brand-icon";
import { ContactForm } from "@/components/contact/contact-form";
import { CopyButton } from "@/components/contact/copy-button";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { SimpleFooter } from "@/components/site/site-footer";
import { site } from "@/content/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("contact") };
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  const channels = [
    { label: t("email"), value: site.email, href: `mailto:${site.email}`, icon: <Mail size={18} aria-hidden /> },
    { label: "LinkedIn", value: site.social.linkedin.handle, href: site.social.linkedin.url, icon: <BrandIcon brand="linkedin" size={17} /> },
    { label: "GitHub", value: site.social.github.handle, href: site.social.github.url, icon: <BrandIcon brand="github" size={18} /> },
    { label: "X / Twitter", value: site.social.x.handle, href: site.social.x.url, icon: <BrandIcon brand="x" size={16} /> },
  ];

  return (
    <>
      <section className="wrap pb-30 pt-[clamp(48px,7vw,96px)]">
        <div className="flex flex-wrap items-start gap-16">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-8">
            <span className="label text-accent-ink">{t("eyebrow")}</span>
            <SplitHeadline as="h1" immediate text={t("title")} accent="." className="text-[clamp(72px,12vw,184px)]" />
            <Reveal delay={0.2} as="p" className="m-0 max-w-[480px] text-lg leading-relaxed text-muted-foreground">
              {t("intro")}
            </Reveal>
            <Reveal delay={0.3} className="flex flex-wrap items-center gap-2.5">
              <a
                href={`mailto:${site.email}`}
                className="heading break-all text-[clamp(20px,2vw,28px)] tracking-[-0.02em] underline decoration-accent decoration-2 underline-offset-[6px]"
              >
                {site.email}
              </a>
              <CopyButton value={site.email} label={t("copy")} copiedLabel={t("copied")} />
            </Reveal>

            <div className="hairline mt-4 border-b">
              <span className="label mb-2 block text-muted-foreground">{t("channels")}</span>
              <Stagger>
                {channels.map((c) => (
                  <StaggerItem key={c.label}>
                    <a
                      href={c.href}
                      className="card-link hairline grid grid-cols-[minmax(0,1fr)_44px] items-center gap-4 border-t py-5 nav:grid-cols-[120px_minmax(0,1fr)_44px]"
                    >
                      <span className="label hidden items-center gap-2.5 text-muted-foreground nav:flex">
                        <span className="text-foreground">{c.icon}</span>
                        {c.label}
                      </span>
                      <span className="card-title flex min-w-0 items-center gap-2.5 font-semibold">
                        <span className="flex-none nav:hidden">{c.icon}</span>
                        <span className="truncate">{c.value}</span>
                      </span>
                      <span className="card-arrow hairline inline-flex size-11 items-center justify-center rounded-full border">
                        <ArrowUpRight size={16} aria-hidden />
                      </span>
                    </a>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>

          <Reveal delay={0.15} className="flex min-w-0 flex-[1_1_480px]">
            <ContactForm />
          </Reveal>
        </div>
      </section>
      <SimpleFooter />
    </>
  );
}
