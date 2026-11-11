import { PenLine, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import { fmtDay, fmtDayShort, fmtDayTime, StatusBadge, statusMeta, whenLabel } from "@/components/studio/status";
import { socialCounts } from "@/lib/social-data";
import { tones } from "@/lib/tones";
import { studioCounts, studioIdeas, studioLastPublished, studioNextScheduled, studioRecentNotes, studioSubjects } from "@/lib/notes";
import { subscriberCounts } from "@/lib/newsletter";
import { weekVisitors } from "@/lib/stats";
import { QuickIdea } from "./quick-idea";

export const metadata: Metadata = { title: "Tableau de bord" };

function StatCard({ href, label, value, dot, note }: { href?: string; label: string; value: string | number; dot: string; note: string }) {
  const body = (
    <>
      <span className="label text-muted-foreground">{label}</span>
      <span className="display text-[52px]">{value}</span>
      <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <span className="size-2 rounded-full" style={{ background: dot }} />
        {note}
      </span>
    </>
  );
  const cls = "hairline flex flex-col gap-2.5 rounded-2xl border bg-card p-5";
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:bg-surface`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function DashboardPage() {
  const [counts, next, recent, subjects, ideas, lastPublished, social, subs, visitors] = await Promise.all([
    studioCounts(),
    studioNextScheduled(),
    studioRecentNotes(5),
    studioSubjects(),
    studioIdeas(),
    studioLastPublished(),
    socialCounts(),
    subscriberCounts(),
    weekVisitors(),
  ]);
  const maxCount = Math.max(1, ...subjects.map((s) => s.count));

  const summary = [
    counts.draft ? `${counts.draft} brouillon${counts.draft > 1 ? "s" : ""}` : "aucun brouillon",
    next ? `prochaine note le ${fmtDayShort(next)}` : "aucune note programmée",
  ].join(", ");

  const shortcuts = [
    { href: "/studio/notes/new", k: "Créer", t: "Écrire une nouvelle note" },
    ...(lastPublished ? [{ href: `/studio/notes/${lastPublished}`, k: "Éditer", t: "Reprendre la dernière note publiée" }] : []),
    { href: "/studio/notes", k: "Gérer", t: "Trier, publier ou supprimer en lot" },
    { href: "/studio/subjects", k: "Organiser", t: "Ajouter ou renommer un sujet" },
    { href: "/studio/social/compose", k: "Social", t: "Partager une note sur les réseaux" },
    { href: "/studio/social/calendar", k: "Social", t: "Orchestrer la semaine" },
  ];

  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio" }, { label: "Tableau de bord" }]}>
        <Link href="/studio/notes/new" className="btn btn-primary min-h-11 px-[18px] text-sm">
          <Plus size={16} aria-hidden />
          Nouvelle note
        </Link>
      </StudioTopBar>

      <div className="flex flex-col gap-7 p-[clamp(24px,3vw,40px)]">
        <StudioHeading kicker="Tableau de bord" title="Bonjour, Patrick" intro={`Blog : ${summary}.`} />

        <div className="hairline flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <h2 className="m-0 flex items-center gap-2.5 text-xl font-bold">
            <span className="size-2.5 rounded-[3px] bg-accent" />
            Blog
          </h2>
          <Link href="/studio/notes" className="text-sm font-semibold underline underline-offset-[3px]">
            Gérer les notes
          </Link>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
          <StatCard href="/studio/notes?statut=published" label="Publiées" value={counts.published} dot={statusMeta.published.dot} note="En ligne sur le blog" />
          <StatCard href="/studio/notes?statut=draft" label="Brouillons" value={counts.draft} dot={statusMeta.draft.dot} note="À terminer" />
          <StatCard
            href="/studio/notes?statut=scheduled"
            label="Programmées"
            value={counts.scheduled}
            dot={statusMeta.scheduled.dot}
            note={next ? `Prochaine : ${fmtDay(next)}` : "Rien de prévu"}
          />
          <StatCard
            href="/studio/newsletter"
            label="Abonnés newsletter"
            value={subs.active}
            dot="var(--accent-ink)"
            note={subs.pending ? `${subs.pending} en attente de confirmation` : "Confirmés"}
          />
          <StatCard
            href="/studio/stats?jours=7"
            label="Visiteurs · 7 jours"
            value={visitors.now}
            dot="var(--success)"
            note={visitors.before ? `${visitors.now >= visitors.before ? "+" : ""}${Math.round(((visitors.now - visitors.before) / visitors.before) * 100)} % vs semaine précédente` : "Statistiques du site"}
          />
        </div>

        <div className="flex flex-wrap items-start gap-5">
          <section className="hairline min-w-0 flex-[999_1_520px] overflow-hidden rounded-[20px] border bg-card">
            <div className="flex items-center justify-between gap-3 px-6 py-5">
              <h2 className="m-0 text-lg font-bold">Activité récente</h2>
              <Link href="/studio/notes" className="btn btn-ghost min-h-10 px-4 text-sm">
                Toutes les notes
              </Link>
            </div>
            {recent.length === 0 && (
              <p className="hairline m-0 border-t px-6 py-10 text-center text-muted-foreground">Aucune note pour l&apos;instant.</p>
            )}
            {recent.map((n) => (
              <div key={n.id} className="hairline flex items-center gap-4 border-t px-6 py-3.5">
                <span className="h-10 w-3 flex-none rounded-md" style={{ background: tones[n.tone]?.bg }} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link href={`/studio/notes/${n.id}`} className="truncate text-[15px] font-semibold hover:text-accent-ink hover:underline hover:underline-offset-[3px]">
                    {n.title}
                  </Link>
                  <span className="text-[13px] text-muted-foreground">
                    {n.subject.nameFr} · {whenLabel(n.status, n.publishedAt, n.updatedAt)}
                  </span>
                </div>
                <StatusBadge status={n.status} />
                <Link href={`/studio/notes/${n.id}`} className="icon-btn size-10" aria-label={`Éditer « ${n.title} »`}>
                  <PenLine size={16} aria-hidden />
                </Link>
              </div>
            ))}
          </section>

          <div className="flex flex-[1_1_320px] flex-col gap-5">
            <QuickIdea ideas={ideas.map((i) => ({ id: i.id, title: i.title }))} />

            <section className="hairline flex flex-col gap-4 rounded-[20px] border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-lg font-bold">Par sujet</h2>
                <Link href="/studio/subjects" className="text-sm font-semibold underline underline-offset-[3px]">
                  Gérer
                </Link>
              </div>
              {subjects.map((s) => (
                <div key={s.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.nameFr}</span>
                    <span className="label text-muted-foreground">{s.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full border border-ink/8"
                      style={{ width: `${Math.round((s.count / maxCount) * 100)}%`, background: tones[s.tone as keyof typeof tones]?.bg }}
                    />
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>

        <div className="hairline flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <h2 className="m-0 flex items-center gap-2.5 text-xl font-bold">
            <span className="size-2.5 rounded-[3px] bg-success" />
            Réseaux sociaux
          </h2>
          <Link href="/studio/social" className="text-sm font-semibold underline underline-offset-[3px]">
            Vue d&apos;ensemble
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
          <StatCard
            href="/studio/social/posts?statut=due"
            label="À publier"
            value={social.due}
            dot={social.due ? "var(--accent)" : "var(--muted-foreground)"}
            note={social.due ? "Un clic par réseau" : "Rien en attente"}
          />
          <StatCard
            href="/studio/social/calendar"
            label="Programmées · 7 jours"
            value={social.scheduledWeek}
            dot="var(--accent)"
            note={social.next ? `Prochaine : ${fmtDayTime(social.next)}` : "Rien de prévu"}
          />
          <StatCard href="/studio/social/calendar" label="File d'attente" value={social.drafts} dot="var(--muted-foreground)" note="Brouillons à planifier" />
          <StatCard href="/studio/social/posts?statut=published" label="Publiées · 30 j" value={social.publishedMonth} dot="var(--success)" note="Sur LinkedIn, Instagram, X" />
        </div>

        <section className="flex flex-col gap-3.5">
          <h2 className="m-0 text-lg font-bold">Raccourcis</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
            {shortcuts.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="flex flex-col gap-3 rounded-2xl border border-dashed border-ink/18 p-[18px] transition-colors hover:border-solid hover:border-ink"
              >
                <span className={`label ${s.k === "Social" ? "text-success-ink" : "text-accent-ink"}`}>{s.k}</span>
                <span className="font-semibold">{s.t}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
