"use client";

import { Check, Copy, ExternalLink, ImageDown, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { markPublished } from "@/app/studio/social-actions";
import { EASE } from "@/components/motion/ease";
import { cn } from "@/lib/cn";
import { composeUrl, finalText, NETWORKS, type SocialNetwork } from "@/lib/social";
import type { PostView } from "@/lib/social-data";
import { NetBadge } from "./net-badge";
import { fmtDayTime } from "./status";
import { useToast } from "./toast";

function NetworkStep({ post, network }: { post: PostView; network: SocialNetwork }) {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState<"text" | "comment" | null>(null);
  const [pending, start] = useTransition();
  const done = post.published[network];
  const text = finalText({ ...post, link: post.link ?? "" }, network);

  const copy = async (value: string, what: "text" | "comment") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast("Copie impossible, sélectionnez le texte à la main.", { tone: "error" });
    }
  };

  return (
    <div className={cn("hairline flex flex-col gap-3 rounded-2xl border p-4", done ? "bg-secondary/50" : "bg-card")}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 font-bold">
          <NetBadge network={network} size={28} />
          {NETWORKS[network].name}
        </span>
        {done ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-success-ink">
            <Check size={15} aria-hidden /> Publié le {fmtDayTime(done.at)}
            {done.url && (
              <a href={done.url} target="_blank" rel="noreferrer" className="underline underline-offset-[3px]">
                voir ↗
              </a>
            )}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">À publier</span>
        )}
      </div>

      {!done && (
        <>
          <pre className="m-0 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-background p-3 font-sans text-[13px] leading-relaxed">{text}</pre>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost min-h-10 px-4 text-sm" onClick={() => copy(text, "text")}>
              {copied === "text" ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
              {copied === "text" ? "Copié" : "Copier le texte"}
            </button>
            <a href={composeUrl(network, text)} target="_blank" rel="noreferrer" className="btn btn-primary min-h-10 px-4 text-sm">
              <ExternalLink size={15} aria-hidden />
              Ouvrir {NETWORKS[network].name}
            </a>
            {post.firstComment && NETWORKS[network].firstComment && (
              <button type="button" className="btn btn-ghost min-h-10 px-4 text-sm" onClick={() => copy(post.firstComment, "comment")}>
                {copied === "comment" ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
                {copied === "comment" ? "Copié" : "Copier le 1er commentaire"}
              </button>
            )}
          </div>
          {post.media.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {network === "instagram" ? "Images à ajouter depuis l'app :" : "Images :"}
              </span>
              {post.media.map((src, i) => (
                <a key={src} href={src} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-ink/18 px-3 text-xs font-semibold hover:border-ink">
                  <ImageDown size={13} aria-hidden /> Image {i + 1}
                </a>
              ))}
            </div>
          )}
          {network === "linkedin" && post.media.length > 0 && (
            <span className="text-xs text-muted-foreground">LinkedIn pré-remplit le texte ; ajoutez les images dans sa fenêtre de publication.</span>
          )}
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const res = await markPublished(post.id, network, url);
                if (!res.ok) return toast(res.error, { tone: "error" });
                toast(res.data!.done ? "Publication terminée sur tous les réseaux" : `${NETWORKS[network].name} marqué comme publié`);
              });
            }}
          >
            <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
              <label className="text-xs font-semibold" htmlFor={`url-${network}`}>
                Lien de la publication <span className="font-normal text-muted-foreground">(facultatif)</span>
              </label>
              <input
                id={`url-${network}`}
                type="url"
                className="field min-h-10 rounded-xl py-1.5 text-sm"
                placeholder="https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button type="submit" className="btn min-h-10 bg-success px-4 text-sm text-white hover:bg-success-ink" disabled={pending}>
              <Check size={15} aria-hidden />
              Marquer comme publié
            </button>
          </form>
        </>
      )}
    </div>
  );
}

/** "À publier" helper: one step per network, until every network is marked as published. */
export function PublishDialog({ post, onClose }: { post: PostView | null; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!post) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [post, onClose]);

  return (
    <AnimatePresence>
      {post && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end bg-ink/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Publier"
            tabIndex={-1}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-[560px] flex-col gap-4 overflow-y-auto bg-background p-6 shadow-2xl outline-none"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="label text-accent-ink">À publier</span>
                <h2 className="display text-[40px]">
                  Publier<span className="text-accent">.</span>
                </h2>
                {post.scheduledAt && <span className="text-[13px] text-muted-foreground">Prévu le {fmtDayTime(post.scheduledAt)}</span>}
              </div>
              <button type="button" className="icon-btn" aria-label="Fermer" onClick={onClose}>
                <X size={18} aria-hidden />
              </button>
            </div>
            <p className="m-0 text-sm leading-relaxed text-muted-foreground">
              Pour chaque réseau : copiez le texte, ouvrez le réseau, publiez, puis marquez-le comme publié. Collez le lien du post si vous voulez le
              retrouver ensuite.
            </p>
            {post.networks.map((n) => (
              <NetworkStep key={n} post={post} network={n} />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
