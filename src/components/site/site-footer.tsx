import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { site } from "@/content/site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { navItems } from "./nav-items";
import { SocialLink, SOCIALS } from "./social-link";

function FooterLinks({ extra }: { extra?: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-6">
      {extra}
      <a href={site.studio.url} className="hover:text-blob-a">{site.studio.name} ↗</a>
      {SOCIALS.map((s) => (
        <SocialLink key={s.brand} brand={s.brand} href={s.url} className="hover:text-blob-a">
          {s.label} ↗
        </SocialLink>
      ))}
    </div>
  );
}

/** The bottom legal row shared by every dark footer. */
export function FooterBar({ className, extraLinks }: { className?: string; extraLinks?: ReactNode }) {
  const t = useTranslations("footer");
  return (
    <div className={cn("label flex flex-wrap justify-between gap-4 text-background/60 [&_a]:text-background/70", className)}>
      <span>{t("rights", { year: new Date().getFullYear() })}</span>
      <FooterLinks extra={extraLinks} />
      <span>{t("location")}</span>
    </div>
  );
}

/**
 * Dark ink band that closes most pages: a call-to-action on top, a hairline,
 * then the legal row.
 */
export function CtaFooter({
  children,
  extraLinks,
  compact = false,
}: {
  children: ReactNode;
  extraLinks?: ReactNode;
  compact?: boolean;
}) {
  return (
    <footer className="bg-ink text-background">
      <div className={cn("wrap", compact ? "pb-10 pt-20" : "pb-12 pt-24")}>
        {children}
        <div className={cn("h-px bg-background/12", compact ? "mb-8 mt-16" : "mb-10 mt-[72px]")} />
        <FooterBar extraLinks={extraLinks} />
      </div>
    </footer>
  );
}

/** Minimal footer (Contact page). */
export function SimpleFooter() {
  return (
    <footer className="bg-ink text-background">
      <div className="wrap py-10">
        <FooterBar />
      </div>
    </footer>
  );
}

/** Full sitemap footer (Home). */
export function SitemapFooter() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  return (
    <>
      <div className="mb-12 mt-24 h-px bg-background/12" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8 [&_a]:text-background/70 [&_a:hover]:text-blob-a">
        <div>
          <div className="display text-[22px] leading-none tracking-[-0.02em]">
            {site.name}
            <span className="text-accent">.</span>
          </div>
          <p className="mt-3 max-w-[260px] text-sm leading-relaxed text-background/60">{t("tagline")}</p>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="label mb-1.5 text-background/60">{t("sitemap")}</span>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {nav(item.key)}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="label mb-1.5 text-background/60">{t("elsewhere")}</span>
          <a href={site.studio.url}>{site.studio.name} ↗</a>
          {SOCIALS.map((s) => (
            <SocialLink key={s.brand} brand={s.brand} href={s.url}>
              {s.brand === "x" ? "X / Twitter" : s.label} ↗
            </SocialLink>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="label mb-1.5 text-background/60">{t("basedIn")}</span>
          <span className="text-background/70">{t("basedInValue")}</span>
        </div>
      </div>
      <div className="label mt-[72px] flex flex-wrap justify-between gap-3 text-background/60">
        <span>{t("rights", { year: new Date().getFullYear() })}</span>
        <span>{t("built")}</span>
      </div>
    </>
  );
}
