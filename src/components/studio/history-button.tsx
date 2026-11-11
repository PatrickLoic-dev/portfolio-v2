"use client";

import { History, RotateCcw, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { getHistory, type HistoryEntry } from "@/app/studio/history-actions";
import { EASE } from "@/components/motion/ease";
import { useToast } from "@/components/studio/toast";
import { cn } from "@/lib/cn";

const when = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * "Historique": the saved versions of a note or a project in a side panel.
 * Loading one puts it in the editor; nothing changes on the site until it is saved.
 */
export function HistoryButton<T>({
  entity,
  id,
  dirty,
  savedAt,
  onRestore,
}: {
  entity: "note" | "project";
  id: string | null;
  dirty: boolean;
  /** Refreshes the list after each save. */
  savedAt: string | null;
  onRestore: (snapshot: T) => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HistoryEntry[] | null>(null);
  const [loading, start] = useTransition();
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !id) return;
    start(async () => setItems(await getHistory(entity, id)));
  }, [open, id, entity, savedAt]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const restore = (entry: HistoryEntry, i: number) => {
    if (dirty && !window.confirm("Vos modifications non enregistrées seront remplacées par cette version. Continuer ?")) return;
    onRestore(entry.snapshot as T);
    close();
    toast(i === 0 ? "Dernière version rechargée" : `Version du ${when(entry.at)} chargée : enregistrez pour la rétablir`);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="btn btn-ghost min-h-11 px-4 text-sm"
        onClick={() => setOpen(true)}
        disabled={!id}
        title={id ? "Voir les versions enregistrées" : "Enregistrez une première fois pour démarrer l'historique"}
        aria-haspopup="dialog"
      >
        <History size={16} aria-hidden />
        Historique
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-40 bg-ink/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              aria-hidden
            />
            <motion.aside
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="history-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: EASE }}
              className="fixed inset-y-0 right-0 z-50 flex w-[min(420px,100vw)] flex-col bg-card shadow-[-24px_0_60px_-30px_rgb(37_30_25/0.45)]"
            >
              <div className="hairline flex items-center justify-between gap-3 border-b px-6 py-5">
                <div className="flex flex-col gap-1">
                  <span className="label text-accent-ink">{entity === "note" ? "Note" : "Projet"}</span>
                  <h2 id="history-title" className="m-0 text-xl font-bold">
                    Historique des versions
                  </h2>
                </div>
                <button ref={closeRef} type="button" className="icon-btn size-10" aria-label="Fermer l'historique" onClick={close}>
                  <X size={18} aria-hidden />
                </button>
              </div>
              <p className="m-0 px-6 pt-4 text-[13px] leading-relaxed text-muted-foreground">
                Une version est gardée à chaque enregistrement (les enregistrements rapprochés sont regroupés). Charger une version la place dans
                l&apos;éditeur : le site ne change qu&apos;une fois enregistrée.
              </p>
              <ol className="m-0 flex flex-1 list-none flex-col gap-2 overflow-y-auto p-4" aria-busy={loading}>
                {!items && <li className="px-2 py-6 text-center text-sm text-muted-foreground">Chargement…</li>}
                {items?.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted-foreground">Pas encore de version enregistrée.</li>}
                {items?.map((entry, i) => (
                  <li key={entry.id} className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3", i === 0 ? "border-ink/14 bg-surface" : "border-transparent hover:bg-surface/60")}>
                    <span className={cn("size-2.5 flex-none rounded-full", i === 0 ? "bg-success" : "bg-ink/20")} aria-hidden />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-semibold">
                        {when(entry.at)}
                        {i === 0 && <span className="label ml-2 text-success-ink">Actuelle</span>}
                      </span>
                      <span className="truncate text-[13px] text-muted-foreground">
                        {entry.label} · {entry.summary} · {entry.words} mots
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost min-h-10 flex-none px-3 text-[13px]"
                      onClick={() => restore(entry, i)}
                      aria-label={`Charger la version du ${when(entry.at)}`}
                    >
                      <RotateCcw size={14} aria-hidden />
                      Charger
                    </button>
                  </li>
                ))}
              </ol>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
