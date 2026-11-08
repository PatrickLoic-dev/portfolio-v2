import { ArrowRight, PenSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { NetBadge } from "@/components/studio/net-badge";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import { fmtDayTime } from "@/components/studio/status";
import { getSetting } from "@/lib/portfolio";
import { NETWORK_KEYS, NETWORKS } from "@/lib/social";
import { allSocialPosts, socialCounts, upcomingSocialPosts } from "@/lib/social-data";

export const metadata: Metadata = { title: "Réseaux sociaux" };

function Stat({ href, label, value, note, tone }: { href: string; label: string; value: number | string; note: string; tone?: string }) {
  return (
    <Link href={href} className="hairline flex flex-col gap-2.5 rounded-2xl border bg-card p-5 transition-colors hover:bg-surface" style={tone ? { background: tone } : undefined}>
      <span className="label text-muted-foreground">{label}</span>
      <span className="display text-[52px]">{value}</span>
      <span className="text-[13px] text-muted-foreground">{note}</span>
    </Link>
  );
}

export default async function SocialOverviewPage() {
  const [counts, posts, social, upcoming] = await Promise.all([socialCounts(), allSocialPosts(), getSetting("social"), upcomingSocialPosts(7)]);
  const connected = NETWORK_KEYS.filter((n) => social.accounts[n].handle).length;

  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Réseaux sociaux" }, { label: "Vue d'ensemble" }]}>
        <Link href="/studio/social/compose" className="btn btn-primary min-h-11 px-[18px] text-sm">
          <PenSquare size={16} aria-hidden />
          Composer une publication
        </Link>
      </StudioTopBar>
      <div className="flex flex-col gap-6 p-[clamp(24px,3vw,40px)]">
        <StudioHeading
          kicker={`Réseaux sociaux · ${connected} compte${connected > 1 ? "s" : ""} renseigné${connected > 1 ? "s" : ""}`}
          title="Vue d'ensemble"
          intro="Planifiez vos posts LinkedIn, Instagram et X. À l'heure prévue, le Studio vous les présente prêts à copier et à publier."
        />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
          <Stat
            href="/studio/social/posts?statut=due"
            label="À publier"
            value={counts.due}
            note={counts.due ? "Prêtes — un clic par réseau" : "Rien en attente"}
            tone={counts.due ? "color-mix(in srgb, var(--accent) 16%, var(--card))" : undefined}
          />
          <Stat href="/studio/social/calendar" label="Programmées · 7 jours" value={counts.scheduledWeek} note={counts.next ? `Prochaine : ${fmtDayTime(counts.next)}` : "Rien de prévu"} />
          <Stat href="/studio/social/calendar" label="File d'attente" value={counts.drafts} note="Brouillons à planifier" />
          <Stat href="/studio/social/posts?statut=published" label="Publiées · 30 jours" value={counts.publishedMonth} note="Marquées comme publiées" />
        </div>

        <div className="flex flex-wrap items-start gap-5">
          <section className="hairline min-w-0 flex-[999_1_520px] overflow-hidden rounded-[20px] border bg-card">
            <div className="flex items-center justify-between gap-3 px-6 py-5">
              <h2 className="m-0 text-lg font-bold">Par réseau</h2>
              <Link href="/studio/social/accounts" className="text-sm font-semibold underline underline-offset-[3px]">
                Gérer les comptes
              </Link>
            </div>
            {NETWORK_KEYS.map((n) => {
              const acc = social.accounts[n];
              const next = upcoming.find((p) => p.networks.includes(n));
              const total = posts.filter((p) => p.networks.includes(n) && p.status === "published").length;
              return (
                <div key={n} className="hairline flex flex-wrap items-center gap-4 border-t px-6 py-4">
                  <NetBadge network={n} size={36} className="rounded-lg" />
                  <div className="flex min-w-[160px] flex-1 flex-col">
                    <span className="font-semibold">{NETWORKS[n].name}</span>
                    {acc.handle ? (
                      acc.url ? (
                        <a href={acc.url} target="_blank" rel="noreferrer" className="text-[13px] text-muted-foreground hover:underline">
                          {acc.handle} ↗
                        </a>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">{acc.handle}</span>
                      )
                    ) : (
                      <Link href="/studio/social/accounts" className="text-[13px] font-semibold text-accent-ink underline underline-offset-[3px]">
                        Renseigner le compte
                      </Link>
                    )}
                  </div>
                  <span className="w-[110px] text-[13px] text-muted-foreground">{total} publiée{total > 1 ? "s" : ""}</span>
                  <span className="w-[170px] text-[13px]">{next ? `Prochaine : ${fmtDayTime(next.scheduledAt!)}` : <span className="text-muted-foreground">Rien de prévu</span>}</span>
                </div>
              );
            })}
          </section>

          <div className="flex flex-[1_1_320px] flex-col gap-5">
            <section className="hairline flex flex-col gap-1 rounded-[20px] border bg-card p-6">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="m-0 text-lg font-bold">À venir cette semaine</h2>
                <Link href="/studio/social/calendar" className="text-sm font-semibold underline underline-offset-[3px]">
                  Calendrier
                </Link>
              </div>
              {upcoming.length === 0 && <span className="text-sm text-muted-foreground">Rien de programmé dans les 7 prochains jours.</span>}
              {upcoming.slice(0, 6).map((p) => (
                <Link key={p.id} href={`/studio/social/compose?id=${p.id}`} className="hairline flex items-start gap-3 border-t py-3 hover:text-accent-ink">
                  <span className="w-[92px] flex-none font-mono text-xs text-muted-foreground">{fmtDayTime(p.scheduledAt!)}</span>
                  <span className="line-clamp-2 flex-1 text-[13px] leading-snug">{p.text}</span>
                  <span className="flex gap-0.5">
                    {p.networks.map((n) => (
                      <NetBadge key={n} network={n} size={16} />
                    ))}
                  </span>
                </Link>
              ))}
            </section>

            <section className="flex flex-col gap-2 rounded-[20px] border border-dashed border-ink/20 p-6">
              <span className="label text-success-ink">Bientôt</span>
              <span className="font-semibold">Messagerie et statistiques</span>
              <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
                Commentaires, messages et chiffres arriveront quand les API seront branchées (Instagram en premier : son API les fournit).
              </p>
              <Link href="/studio/social/posts" className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold">
                Toutes les publications <ArrowRight size={14} aria-hidden />
              </Link>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
