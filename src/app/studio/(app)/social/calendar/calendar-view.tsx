"use client";

import { CalendarPlus, ChevronLeft, ChevronRight, Copy, PenLine, Send, Undo2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EASE } from "@/components/motion/ease";
import { NetBadge } from "@/components/studio/net-badge";
import { PublishDialog } from "@/components/studio/publish-dialog";
import { fmtDayTime } from "@/components/studio/status";
import { useToast } from "@/components/studio/toast";
import { cn } from "@/lib/cn";
import { DAY_SHORT, NETWORK_KEYS, NETWORKS, type SocialNetwork, type SocialSettings } from "@/lib/social";
import type { PostView } from "@/lib/social-data";
import { duplicatePost, scheduleNext, shiftPost, unschedule } from "../../../social-actions";

const OFFSET = 60 * 60 * 1000;
const DAY = 86400000;
const local = (iso: string) => new Date(new Date(iso).getTime() + OFFSET); // read with UTC getters
const hhmm = (iso: string) => local(iso).toISOString().slice(11, 16);
const dayFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" });

export function CalendarView({
  weekStart,
  posts,
  queue,
  slots,
  today,
}: {
  today: string;
  weekStart: string;
  posts: PostView[];
  queue: PostView[];
  slots: SocialSettings["slots"];
}) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<SocialNetwork[]>([...NETWORK_KEYS]);
  const [selected, setSelected] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const startMs = new Date(weekStart).getTime();
  const days = Array.from({ length: 7 }, (_, i) => new Date(startMs + i * DAY));
  const todayKey = today;
  const visible = posts.filter((p) => p.networks.some((n) => filter.includes(n)));
  const sel = posts.find((p) => p.id === selected) ?? queue.find((p) => p.id === selected) ?? null;
  const weekParam = (offset: number) => local(new Date(startMs + offset * 7 * DAY).toISOString()).toISOString().slice(0, 10);
  const label = `${dayFmt.format(local(days[0].toISOString()))} au ${dayFmt.format(local(days[6].toISOString()))}`;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return toast(res.error ?? "Erreur", { tone: "error" });
      toast(ok);
    });

  return (
    <div className="flex flex-col gap-5 p-[clamp(24px,3vw,40px)]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-3">
          <span className="label text-accent-ink">Orchestrer · {visible.length} publication{visible.length > 1 ? "s" : ""} cette semaine</span>
          <h1 className="display text-[clamp(44px,5vw,72px)]">
            Calendrier<span className="text-accent">.</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`?semaine=${weekParam(-1)}`} className="icon-btn" aria-label="Semaine précédente">
            <ChevronLeft size={18} aria-hidden />
          </Link>
          <span className="min-w-[200px] text-center text-sm font-semibold">{label}</span>
          <Link href={`?semaine=${weekParam(1)}`} className="icon-btn" aria-label="Semaine suivante">
            <ChevronRight size={18} aria-hidden />
          </Link>
          <Link href="/studio/social/calendar" className="btn btn-ghost min-h-11 text-sm">
            Cette semaine
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Réseaux" className="flex flex-wrap gap-2">
          {NETWORK_KEYS.map((n) => {
            const on = filter.includes(n);
            return (
              <button
                key={n}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(on ? filter.filter((x) => x !== n) : [...filter, n])}
                className={cn("inline-flex min-h-10 items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-sm font-medium", on ? "border-ink" : "border-ink/18 opacity-60")}
              >
                <NetBadge network={n} size={28} className="rounded-full" />
                {NETWORKS[n].name}
                <span className="font-mono text-[11px] opacity-70">{posts.filter((p) => p.networks.includes(n)).length}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-blob-c" /> Programmée</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-blob-b" /> Publiée</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-dashed border-ink/40" /> Créneau conseillé</span>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-5">
        {/* Week grid */}
        <div className={cn("hairline min-w-0 flex-[999_1_640px] overflow-x-auto rounded-[20px] border bg-card transition-opacity", pending && "opacity-70")}>
          <div className="grid min-w-[760px] grid-cols-7">
            {days.map((d, i) => {
              const key = local(d.toISOString()).toISOString().slice(0, 10);
              const items = visible.filter((p) => p.scheduledAt && local(p.scheduledAt).toISOString().slice(0, 10) === key);
              const daySlots = filter.flatMap((n) => (slots[n] ?? []).filter((s) => s.day === i + 1).map((s) => ({ ...s, n })));
              const today = key === todayKey;
              return (
                <div key={key} className={cn("hairline flex min-h-[420px] flex-col gap-2 border-r p-2.5 last:border-r-0", today && "bg-surface/60")}>
                  <div className="flex items-baseline justify-between px-1 pb-1">
                    <span className="label text-muted-foreground">{DAY_SHORT[i + 1]}</span>
                    <span className={cn("display text-2xl", today && "text-accent")}>{local(d.toISOString()).getUTCDate()}</span>
                  </div>
                  {daySlots
                    .filter((s) => !items.some((p) => hhmm(p.scheduledAt!) === s.time))
                    .map((s) => (
                      <div key={`${s.n}-${s.time}`} className="flex items-center justify-between rounded-lg border border-dashed border-ink/25 px-2 py-1.5 text-[11px] text-muted-foreground">
                        <span className="font-mono">{s.time}</span>
                        <NetBadge network={s.n} size={16} />
                      </div>
                    ))}
                  {items.map((p) => (
                    <motion.button
                      key={p.id}
                      layout
                      type="button"
                      onClick={() => setSelected(p.id)}
                      aria-pressed={selected === p.id}
                      className={cn(
                        "flex flex-col gap-1.5 rounded-xl border p-2 text-left transition-shadow",
                        p.status === "published" ? "border-transparent bg-blob-b" : "border-transparent bg-blob-c",
                        p.due && "border-accent",
                        selected === p.id && "ring-2 ring-ink",
                      )}
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-semibold">{hhmm(p.scheduledAt!)}</span>
                        <span className="flex gap-0.5">
                          {p.networks.map((n) => (
                            <NetBadge key={n} network={n} size={16} />
                          ))}
                        </span>
                      </span>
                      <span className="line-clamp-3 text-xs leading-snug">{p.text || "(sans texte)"}</span>
                      {p.due && <span className="text-[10px] font-bold uppercase tracking-wide text-accent-ink">À publier</span>}
                    </motion.button>
                  ))}
                </div>
              );
            })}
          </div>
          {visible.length === 0 && (
            <p className="hairline m-0 border-t px-6 py-5 text-center text-sm text-muted-foreground">
              Rien de programmé cette semaine. Planifiez un brouillon de la file d&apos;attente ou composez une publication.
            </p>
          )}
        </div>

        {/* Details + queue */}
        <aside className="flex flex-[1_1_300px] flex-col gap-4">
          <section className="hairline flex flex-col gap-3 rounded-[20px] border bg-card p-5">
            <AnimatePresence mode="wait" initial={false}>
              {sel ? (
                <motion.div key={sel.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE }} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="m-0 text-base font-bold">Publication</h2>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {sel.due ? "À publier" : sel.status === "published" ? "Publiée" : sel.status === "scheduled" ? "Programmée" : "Brouillon"}
                    </span>
                  </div>
                  {sel.scheduledAt && <span className="text-sm font-semibold">{fmtDayTime(sel.scheduledAt)}</span>}
                  <p className="m-0 line-clamp-6 whitespace-pre-line text-sm leading-relaxed">{sel.text}</p>
                  <div className="flex gap-1.5">
                    {sel.networks.map((n) => (
                      <NetBadge key={n} network={n} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sel.status === "scheduled" && (
                      <button type="button" className={cn("btn min-h-10 px-3.5 text-sm", sel.due ? "btn-primary" : "btn-ghost")} onClick={() => setPublishing(sel.id)}>
                        <Send size={15} aria-hidden /> Publier
                      </button>
                    )}
                    <Link href={`/studio/social/compose?id=${sel.id}`} className="btn btn-ghost min-h-10 px-3.5 text-sm">
                      <PenLine size={15} aria-hidden /> Modifier
                    </Link>
                    {sel.status === "scheduled" && (
                      <>
                        <button type="button" className="btn btn-ghost min-h-10 px-3.5 text-sm" onClick={() => run(() => shiftPost(sel.id, 1), "Décalée d'un jour")}>
                          +1 jour
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost min-h-10 px-3.5 text-sm"
                          onClick={() =>
                            run(async () => {
                              const r = await unschedule(sel.id);
                              setSelected(null);
                              return r;
                            }, "Déprogrammée, remise dans la file d'attente")
                          }
                        >
                          <Undo2 size={15} aria-hidden /> Déprogrammer
                        </button>
                      </>
                    )}
                    <button type="button" className="btn btn-ghost min-h-10 px-3.5 text-sm" onClick={() => run(() => duplicatePost(sel.id), "Copie ajoutée aux brouillons")}>
                      <Copy size={15} aria-hidden /> Dupliquer
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
                  <h2 className="m-0 text-base font-bold">Détails</h2>
                  <p className="m-0 text-sm text-muted-foreground">Cliquez sur une publication pour la modifier, la décaler ou la déprogrammer.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="hairline flex flex-col gap-1 rounded-[20px] border bg-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="m-0 text-base font-bold">File d&apos;attente</h2>
              <span className="text-xs text-muted-foreground">
                {queue.length} brouillon{queue.length > 1 ? "s" : ""}
              </span>
            </div>
            {queue.length === 0 && <span className="text-sm text-muted-foreground">File vide, tout est planifié.</span>}
            {queue.map((q) => (
              <div key={q.id} className="hairline flex flex-col gap-2 border-t py-3">
                <button type="button" onClick={() => setSelected(q.id)} className="flex items-start gap-2 text-left">
                  <span className="flex flex-none gap-0.5 pt-0.5">
                    {q.networks.map((n) => (
                      <NetBadge key={n} network={n} size={16} />
                    ))}
                  </span>
                  <span className="line-clamp-2 text-[13px] leading-snug">{q.text || "(sans texte)"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost min-h-9 self-start px-3 text-xs"
                  onClick={() =>
                    start(async () => {
                      const res = await scheduleNext(q.id);
                      if (!res.ok) return toast(res.error, { tone: "error" });
                      toast(`Planifiée le ${fmtDayTime(res.data!.at)}`);
                      router.push(`?semaine=${local(res.data!.at).toISOString().slice(0, 10)}`);
                    })
                  }
                >
                  <CalendarPlus size={14} aria-hidden /> Planifier au prochain créneau
                </button>
              </div>
            ))}
          </section>
        </aside>
      </div>

      <PublishDialog post={posts.find((p) => p.id === publishing) ?? null} onClose={() => setPublishing(null)} />
    </div>
  );
}
