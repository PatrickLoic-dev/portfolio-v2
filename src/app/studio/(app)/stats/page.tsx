import type { Metadata } from "next";
import Link from "next/link";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import { cn } from "@/lib/cn";
import { audience, RANGES, type Range } from "@/lib/stats";
import { DailyChart } from "./daily-chart";

export const metadata: Metadata = { title: "Statistiques" };

const fmt = (n: number) => n.toLocaleString("fr-FR");

function Delta({ now, before }: { now: number; before: number }) {
  if (!before) return <span className="text-[13px] text-muted-foreground">{now ? "Nouvelle période" : "Pas encore de données"}</span>;
  const pct = Math.round(((now - before) / before) * 100);
  return (
    <span className={cn("text-[13px] font-semibold", pct >= 0 ? "text-success-ink" : "text-danger")}>
      {pct >= 0 ? "▲" : "▼"} {Math.abs(pct)} % <span className="font-normal text-muted-foreground">vs période précédente</span>
    </span>
  );
}

function Stat({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="hairline flex flex-col gap-2.5 rounded-2xl border bg-card p-5">
      <span className="label text-muted-foreground">{label}</span>
      <span className="display text-[44px]">{value}</span>
      {children}
    </div>
  );
}

/** A ranked list where each row's bar is its share of the first row. */
function Ranking({ title, rows, empty }: { title: string; rows: { key: string; name: string; sub?: string; views: number; href?: string }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <section className="hairline flex min-w-0 flex-[1_1_340px] flex-col gap-1 rounded-[20px] border bg-card p-5">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-lg font-bold">{title}</h2>
        <span className="label text-muted-foreground">Vues</span>
      </div>
      {rows.length === 0 && <p className="m-0 py-6 text-center text-sm text-muted-foreground">{empty}</p>}
      <ol className="m-0 flex list-none flex-col gap-1 p-0">
        {rows.map((r) => (
          <li key={r.key} className="relative flex min-h-10 items-center justify-between gap-3 overflow-hidden rounded-lg px-3">
            <span aria-hidden className="absolute inset-y-0 left-0 rounded-lg bg-accent/14" style={{ width: `${(r.views / max) * 100}%` }} />
            <span className="relative min-w-0 truncate text-sm">
              {r.href ? (
                <a href={r.href} target="_blank" rel="noreferrer" className="font-medium hover:underline hover:underline-offset-[3px]">
                  {r.name}
                </a>
              ) : (
                <span className="font-medium">{r.name}</span>
              )}
              {r.sub && <span className="ml-2 font-mono text-xs text-muted-foreground">{r.sub}</span>}
            </span>
            <span className="relative font-mono text-sm">{fmt(r.views)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function StatsPage({ searchParams }: PageProps<"/studio/stats">) {
  const sp = await searchParams;
  const days = (RANGES.find((r) => String(r) === sp.jours) ?? 30) as Range;
  const a = await audience(days);
  const perVisitor = a.now.visitors ? (a.now.views / a.now.visitors).toFixed(1).replace(".", ",") : "0";
  const mobile = a.now.views ? Math.round((a.now.mobile / a.now.views) * 100) : 0;
  const fr = a.locales.find((l) => l.locale === "fr")?.views ?? 0;

  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Site" }, { label: "Statistiques" }]}>
        <nav aria-label="Période" className="hairline flex gap-1 rounded-full border bg-card p-1">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/studio/stats?jours=${r}`}
              aria-current={r === days ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-medium",
                r === days ? "bg-ink text-card" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {r} jours
            </Link>
          ))}
        </nav>
      </StudioTopBar>

      <div className="flex flex-col gap-7 p-[clamp(24px,3vw,40px)]">
        <StudioHeading
          kicker="Site"
          title="Statistiques"
          intro="Visites du site public, sans cookie ni adresse IP conservée. Vos propres visites (connecté au Studio) et les robots ne sont pas comptés."
        />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
          <Stat label={`Visiteurs · ${days} j`} value={fmt(a.now.visitors)}>
            <Delta now={a.now.visitors} before={a.before.visitors} />
          </Stat>
          <Stat label="Pages vues" value={fmt(a.now.views)}>
            <Delta now={a.now.views} before={a.before.views} />
          </Stat>
          <Stat label="Pages par visiteur" value={perVisitor}>
            <span className="text-[13px] text-muted-foreground">Moyenne sur la période</span>
          </Stat>
          <Stat label="Sur mobile" value={`${mobile} %`}>
            <span className="text-[13px] text-muted-foreground">
              {a.now.views ? `${Math.round((fr / a.now.views) * 100)} % des pages lues en français` : "Langue : pas encore de données"}
            </span>
          </Stat>
        </div>

        <section className="hairline rounded-[20px] border bg-card p-6">
          <DailyChart days={a.days} />
        </section>

        <div className="flex flex-wrap items-start gap-5">
          <Ranking
            title="Pages"
            empty="Aucune visite sur cette période."
            rows={a.pages.map((p) => ({ key: p.path, name: p.path, views: p.views, href: p.path }))}
          />
          <Ranking
            title="Sources"
            empty="Aucun site référent pour l'instant."
            rows={[
              ...(a.direct > 0 ? [{ key: "direct", name: "Accès direct", sub: "lien tapé, favori, appli", views: a.direct }] : []),
              ...a.sources.map((s) => ({ key: s.host!, name: s.host!, views: s.views })),
            ].sort((x, y) => y.views - x.views)}
          />
        </div>
        <div className="flex flex-wrap items-start gap-5">
          <Ranking title="Articles du blog" empty="Aucun article lu sur cette période." rows={a.articles.map((p) => ({ key: p.path, name: p.name, views: p.views, href: p.path }))} />
          <Ranking title="Études de cas" empty="Aucun projet consulté sur cette période." rows={a.caseStudies.map((p) => ({ key: p.path, name: p.name, views: p.views, href: p.path }))} />
        </div>
      </div>
    </>
  );
}
