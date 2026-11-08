"use client";

import { ExternalLink, PenLine, Search, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { EASE } from "@/components/motion/ease";
import { fmtDay, StatusBadge, whenLabel } from "@/components/studio/status";
import { useToast } from "@/components/studio/toast";
import { tones, type Tone } from "@/content/projects";
import type { NoteStatus } from "@/db/schema";
import type { StatusFilter } from "@/lib/notes";
import { cn } from "@/lib/cn";
import { deleteNotes, restoreNotes, setNotesStatus } from "../../actions";

export type Row = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  status: NoteStatus;
  publishedAt: string | null;
  updatedAt: string;
  tone: Tone;
  coverUrl: string | null;
  subject: string;
  locales: ("en" | "fr")[];
};

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "published", label: "Publiées" },
  { key: "draft", label: "Brouillons" },
  { key: "scheduled", label: "Programmées" },
];

const grid = "grid grid-cols-[28px_minmax(0,1fr)_110px] items-center gap-4 nav:grid-cols-[36px_minmax(0,3fr)_minmax(0,1fr)_128px_150px_140px]";

export function NotesTable({
  rows,
  status,
  q,
  subjectId,
  counts,
  subjects,
  emptyText,
}: {
  rows: Row[];
  status: StatusFilter;
  q: string;
  subjectId: string;
  counts: Record<StatusFilter, number>;
  subjects: { id: string; name: string }[];
  emptyText: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState(q);

  // Search is URL state, debounced.
  useEffect(() => {
    if (query === q) return;
    const id = setTimeout(() => router.replace(href({ q: query })), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function href(patch: { statut?: StatusFilter; q?: string; sujet?: string }) {
    const p = new URLSearchParams();
    const st = patch.statut ?? status;
    const qq = patch.q ?? query;
    const su = patch.sujet ?? subjectId;
    if (st !== "all") p.set("statut", st);
    if (qq.trim()) p.set("q", qq.trim());
    if (su) p.set("sujet", su);
    const s = p.toString();
    return s ? `${pathname}?${s}` : pathname;
  }

  const visible = rows.filter((r) => sel.has(r.id)).map((r) => r.id);
  const allChecked = rows.length > 0 && rows.every((r) => sel.has(r.id));

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const remove = (ids: string[]) =>
    start(async () => {
      const res = await deleteNotes(ids);
      setSel(new Set());
      if (!res.ok) return toast(res.error, { tone: "error" });
      toast(ids.length > 1 ? `${ids.length} notes supprimées` : "Note supprimée", {
        undo: () =>
          start(async () => {
            await restoreNotes(ids);
            toast(ids.length > 1 ? "Notes restaurées" : "Note restaurée");
          }),
      });
    });

  const bulkStatus = (st: "published" | "draft") =>
    start(async () => {
      const res = await setNotesStatus(visible, st);
      setSel(new Set());
      if (!res.ok) return toast(res.error, { tone: "error" });
      toast(`${visible.length} note${visible.length > 1 ? "s" : ""} ${st === "published" ? "publiée(s)" : "repassée(s) en brouillon"}`);
    });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Statut" className="hairline flex flex-wrap gap-1 rounded-full border bg-card p-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={href({ statut: t.key })}
              aria-current={status === t.key ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors",
                status === t.key ? "bg-ink text-card" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t.label} <span className="font-mono text-[11px] opacity-75">{counts[t.key]}</span>
            </Link>
          ))}
        </nav>
        <div className="flex flex-[1_1_420px] flex-wrap items-center justify-end gap-2.5">
          <label className="flex min-h-11 max-w-[360px] flex-[1_1_240px] items-center gap-2 rounded-full border border-ink/18 bg-card px-3.5 focus-within:border-ink focus-within:shadow-[0_0_0_4px_rgb(37_30_25/0.08)]">
            <Search size={16} className="text-muted-foreground" aria-hidden />
            <input
              type="search"
              aria-label="Rechercher une note"
              placeholder="Rechercher…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-10 w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none"
            />
          </label>
          <select
            aria-label="Filtrer par sujet"
            value={subjectId}
            onChange={(e) => router.replace(href({ sujet: e.target.value }))}
            className="field min-h-11 w-auto min-w-[180px] rounded-full bg-card py-2 text-sm"
          >
            <option value="">Tous les sujets</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AnimatePresence>
        {visible.length > 0 && (
          <motion.div
            role="region"
            aria-label="Actions groupées"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2.5 rounded-2xl bg-ink py-3 pl-5 pr-4 text-background">
              <span className="mr-auto font-semibold">
                {visible.length} note{visible.length > 1 ? "s sélectionnées" : " sélectionnée"}
              </span>
              <button type="button" className="btn min-h-10 bg-card px-4 text-sm text-ink" disabled={pending} onClick={() => bulkStatus("published")}>
                Publier
              </button>
              <button type="button" className="btn btn-outline-dark min-h-10 px-4 text-sm" disabled={pending} onClick={() => bulkStatus("draft")}>
                Repasser en brouillon
              </button>
              <button type="button" className="btn min-h-10 bg-danger px-4 text-sm text-card" disabled={pending} onClick={() => remove(visible)}>
                Supprimer
              </button>
              <button type="button" className="btn min-h-10 bg-transparent px-4 text-sm text-background/80" onClick={() => setSel(new Set())}>
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn("hairline overflow-hidden rounded-[20px] border bg-card transition-opacity", pending && "opacity-60")}>
        <div className={cn(grid, "label bg-surface px-5 py-3.5 text-[11px] text-muted-foreground")}>
          <input
            type="checkbox"
            className="size-[18px] cursor-pointer accent-ink"
            aria-label="Tout sélectionner"
            checked={allChecked}
            onChange={() => setSel(allChecked ? new Set() : new Set(rows.map((r) => r.id)))}
          />
          <span>Titre</span>
          <span className="hidden nav:block">Sujet</span>
          <span>Statut</span>
          <span className="hidden nav:block">Date</span>
          <span className="hidden text-right nav:block">Actions</span>
        </div>

        {rows.map((r) => (
          <div key={r.id} className={cn(grid, "hairline border-t px-5 py-3.5 transition-colors hover:bg-surface")}>
            <input
              type="checkbox"
              className="size-[18px] cursor-pointer accent-ink"
              aria-label={`Sélectionner « ${r.title} »`}
              checked={sel.has(r.id)}
              onChange={() => toggle(r.id)}
            />
            <div className="flex min-w-0 items-center gap-3.5">
              <span
                className="hidden size-11 flex-none rounded-[10px] border border-ink/8 bg-cover bg-center nav:block"
                style={{ background: r.coverUrl ? `center/cover url(${r.coverUrl})` : tones[r.tone]?.bg }}
              />
              <div className="flex min-w-0 flex-col gap-1">
                <Link href={`/studio/notes/${r.id}`} className="text-[15px] font-semibold leading-snug hover:text-accent-ink hover:underline hover:underline-offset-[3px]">
                  {r.title}
                </Link>
                <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="flex flex-none gap-1">
                    {(["fr", "en"] as const).map((l) => (
                      <span
                        key={l}
                        className={cn(
                          "rounded px-1 font-mono text-[10px] uppercase",
                          r.locales.includes(l) ? "bg-ink/8 text-foreground" : "text-muted-foreground/60 line-through",
                        )}
                        title={r.locales.includes(l) ? `Version ${l.toUpperCase()} rédigée` : `Pas de version ${l.toUpperCase()}`}
                      >
                        {l}
                      </span>
                    ))}
                  </span>
                  <span className="truncate">{r.dek}</span>
                </span>
              </div>
            </div>
            <span className="hidden text-sm nav:block">{r.subject}</span>
            <span>
              <StatusBadge status={r.status} />
            </span>
            <span className="hidden font-mono text-xs text-muted-foreground nav:block">
              {r.status === "draft" ? whenLabel(r.status, r.publishedAt, r.updatedAt) : r.publishedAt ? `${r.status === "scheduled" ? "Le " : ""}${fmtDay(r.publishedAt)}` : "—"}
            </span>
            <div className="hidden justify-end gap-1.5 nav:flex">
              <Link href={`/studio/notes/${r.id}`} className="icon-btn size-10" aria-label={`Éditer « ${r.title} »`} title="Éditer">
                <PenLine size={16} aria-hidden />
              </Link>
              {r.status === "published" ? (
                <a href={`/blog/${r.slug}`} target="_blank" className="icon-btn size-10" aria-label={`Voir « ${r.title} » sur le blog`} title="Voir">
                  <ExternalLink size={16} aria-hidden />
                </a>
              ) : (
                <span className="size-10" />
              )}
              <button
                type="button"
                className="icon-btn size-10 hover:border-danger! hover:bg-danger!"
                aria-label={`Supprimer « ${r.title} »`}
                title="Supprimer"
                onClick={() => remove([r.id])}
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="hairline flex flex-col items-center gap-3.5 border-t px-6 py-16 text-center">
            <span className="display text-[32px]">Rien ici</span>
            <p className="m-0 text-muted-foreground">{emptyText}</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {(q || subjectId) && (
                <Link href={href({ q: "", sujet: "" })} onClick={() => setQuery("")} className="btn btn-ghost">
                  Effacer la recherche
                </Link>
              )}
              <Link href="/studio/notes/new" className="btn btn-primary">
                Écrire une note
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
