import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MotionProvider } from "@/components/motion/motion-provider";
import { PageTransition } from "@/components/motion/page-transition";
import { loaderGateScript, SiteLoader } from "@/components/motion/site-loader";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Analytics } from "@/components/site/analytics";
import { SiteHeader } from "@/components/site/site-header";
import { site } from "@/content/site";
import { routing } from "@/i18n/routing";
import { fontVariables } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(site.url),
    title: { default: t("title"), template: `%s · ${site.name}` },
    description: t("description"),
    openGraph: { title: t("title"), description: t("description"), siteName: site.name, locale },
    alternates: { languages: { en: "/", fr: "/fr" } },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Decides before first paint whether the entry loader shows (once per visit). */}
        <script dangerouslySetInnerHTML={{ __html: loaderGateScript }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <MotionProvider>
            <SmoothScroll>
              <SiteHeader />
              <main id="content">{children}</main>
              <SiteLoader />
              <PageTransition />
              <Analytics />
              <VercelAnalytics />
            </SmoothScroll>
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
