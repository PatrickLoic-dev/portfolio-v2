"use client";

import { Check, Copy, ExternalLink, Link2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPreviewLink, getPreviewLink, revokePreviewLink, type PreviewLink } from "@/app/studio/preview-actions";
import { EASE } from "@/components/motion/ease";
import { useToast } from "@/components/studio/toast";

const day = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/**
 * "Lien d'aperçu": a secret link that shows the note or project as it is
 * saved now, published or not, valid 14 days and revocable.
 */
export function PreviewButton({ entity, id, savedAt }: { entity: "note" | "project"; id: string | null; savedAt: string | null }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<PreviewLink | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const box = useRef<HTMLDivElement>(null);
  const url = link ? `${window.location.origin}${link.path}` : "";

  useEffect(() => {
    if (!open || !id) return;
    start(async () => setLink(await getPreviewLink(entity, id)));
  }, [open, id, entity, savedAt]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const create = () =>
    start(async () => {
      const res = await createPreviewLink(entity, id!);
      if (!res.ok) return toast(res.error, { tone: "error" });
      setLink(res.data!);
    });

  const revoke = () =>
    start(async () => {
      await revokePreviewLink(entity, id!);
      setLink(null);
      toast("Lien désactivé : il n'ouvre plus rien");
    });

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        className="btn btn-ghost min-h-11 px-4 text-sm"
        onClick={() => setOpen((o) => !o)}
        disabled={!id}
        aria-expanded={open}
        aria-controls="preview-popover"
        title={id ? "Partager un aperçu avant publication" : "Enregistrez une première fois pour créer un lien d'aperçu"}
      >
        <Link2 size={16} aria-hidden />
        Lien d&apos;aperçu
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id="preview-popover"
            role="dialog"
            aria-label="Lien d'aperçu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="hairline absolute right-0 top-[calc(100%+8px)] z-40 flex w-[min(380px,calc(100vw-32px))] flex-col gap-3 rounded-2xl border bg-card p-4 shadow-[0_18px_40px_-18px_rgb(37_30_25/0.45)]"
          >
            <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
              Toute personne qui a ce lien voit {entity === "note" ? "la note" : "le projet"} tel qu&apos;enregistré, même non publié. Les moteurs de
              recherche ne l&apos;indexent pas.
            </p>
            {link === undefined ? (
              <span className="text-sm text-muted-foreground">Chargement…</span>
            ) : link ? (
              <>
                <div className="flex items-center gap-2">
                  <label htmlFor="preview-url" className="sr-only">
                    Adresse de l&apos;aperçu
                  </label>
                  <input id="preview-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="field min-h-10 flex-1 rounded-xl py-1.5 font-mono text-xs" />
                  <button type="button" className="icon-btn size-10" onClick={copy} aria-label="Copier le lien">
                    {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                  </button>
                  <a href={url} target="_blank" rel="noreferrer" className="icon-btn size-10" aria-label="Ouvrir l'aperçu dans un nouvel onglet">
                    <ExternalLink size={16} aria-hidden />
                  </a>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Valable jusqu&apos;au {day(link.expiresAt)}</span>
                  <button type="button" className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-semibold text-danger" onClick={revoke} disabled={pending}>
                    <X size={14} aria-hidden />
                    Désactiver
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="btn btn-primary min-h-11 text-sm" onClick={create} disabled={pending}>
                {pending ? "Création…" : "Créer un lien (14 jours)"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
