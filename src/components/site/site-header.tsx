"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { useLenis } from "@/components/motion/smooth-scroll";
import { EASE } from "@/components/motion/ease";
import { site } from "@/content/site";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { isActive, navItems } from "./nav-items";

function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const other: Locale = locale === "en" ? "fr" : "en";

  return (
    <button
      type="button"
      className={cn(
        "label hairline inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border bg-transparent px-3.5 transition-colors hover:bg-muted",
        pending && "opacity-60",
        className,
      )}
      aria-label={t("switchLanguage")}
      onClick={() => startTransition(() => router.replace(pathname, { locale: other, scroll: false }))}
    >
      <span className={locale === "en" ? "text-foreground" : "text-muted-foreground"}>EN</span>
      <span aria-hidden className="text-muted-foreground">·</span>
      <span className={locale === "fr" ? "text-foreground" : "text-muted-foreground"}>FR</span>
    </button>
  );
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const lenis = useLenis();
  // The menu is "open on a given path": navigating anywhere closes it for free.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);

  // Freeze page scroll while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const instance = lenis?.current;
    instance?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => {
      instance?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, lenis]);

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-card"
      >
        {t("skip")}
      </a>
      <header className="sticky top-0 z-40 border-b hairline bg-background/95 backdrop-blur-sm nav:static nav:border-b-0 nav:bg-background nav:backdrop-blur-none">
        <div className="wrap flex items-center justify-between gap-6 py-3.5 nav:py-5">
          <Link href="/" className="display text-[18px] leading-none tracking-[-0.02em] nav:text-[20px]">
            {site.name}
            <span className="text-accent">.</span>
          </Link>

          <nav
            aria-label={t("main")}
            className="hairline hidden gap-0.5 rounded-full border bg-card p-1 nav:flex"
          >
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors",
                    active ? "text-card" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span className="relative">{t(item.key)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <LanguageSwitch />
            <Link href="/contact" className="btn btn-primary hidden nav:inline-flex">
              {t("startProject")}
              <ArrowUpRight size={16} strokeWidth={2} aria-hidden />
            </Link>
            <button
              type="button"
              className="hairline inline-flex size-11 cursor-pointer items-center justify-center rounded-full border bg-card nav:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t("closeMenu") : t("openMenu")}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label={t("main")}
            className="fixed inset-x-0 bottom-0 top-[73px] z-30 flex flex-col overflow-y-auto bg-ink px-5 pb-7 pt-3 text-background nav:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <motion.ul
              className="m-0 list-none p-0"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } }}
            >
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <motion.li
                    key={item.href}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
                  >
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "display flex min-h-16 items-center justify-between border-b border-background/12 text-[36px] tracking-[-0.03em] transition-colors hover:text-blob-a",
                        active && "text-blob-a",
                      )}
                    >
                      {t(item.key)}
                      <ArrowUpRight size={22} aria-hidden />
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
            <div className="mt-auto flex flex-col gap-3.5 pt-10">
              <span className="label inline-flex items-center gap-2 text-blob-b">
                <span className="size-2 rounded-full bg-blob-b" />
                {t("available")}
              </span>
              <Link href="/contact" className="btn btn-light">
                {t("startProject")}
              </Link>
              <div className="flex flex-wrap gap-[18px] text-[15px] text-background/70">
                <a href={site.social.github.url} className="hover:text-blob-a">GitHub ↗</a>
                <a href={site.social.linkedin.url} className="hover:text-blob-a">LinkedIn ↗</a>
                <a href={site.social.x.url} className="hover:text-blob-a">X ↗</a>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
