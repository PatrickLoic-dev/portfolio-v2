import Link from "next/link";
import { Fragment, type ReactNode } from "react";

type Crumb = { label: string; href?: string };

/** Top bar of every Studio page: breadcrumb on the left, actions on the right. */
export function StudioTopBar({ crumbs, children }: { crumbs: Crumb[]; children?: ReactNode }) {
  return (
    <div className="hairline flex flex-wrap items-center justify-between gap-4 border-b px-[clamp(20px,3vw,40px)] py-[18px]">
      <nav aria-label="Fil d'Ariane" className="label flex items-center gap-2 text-muted-foreground">
        {crumbs.map((c, i) => (
          <Fragment key={c.label}>
            {i > 0 && <span aria-hidden>/</span>}
            {c.href ? (
              <Link href={c.href} className="hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span className="text-foreground" aria-current="page">
                {c.label}
              </span>
            )}
          </Fragment>
        ))}
      </nav>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  );
}

/** Kicker + big display title + intro paragraph. */
export function StudioHeading({ kicker, title, intro, accent = true }: { kicker: string; title: string; intro?: ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-3">
        <span className="label text-accent-ink">{kicker}</span>
        <h1 className="display text-[clamp(44px,5vw,72px)]">
          {title}
          {accent && <span className="text-accent">.</span>}
        </h1>
      </div>
      {intro && <p className="m-0 max-w-[400px] text-[15px] leading-[1.55] text-muted-foreground">{intro}</p>}
    </div>
  );
}
