"use client";

import { Copy, PenLine, Send, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EASE } from "@/components/motion/ease";
import { NetBadge } from "@/components/studio/net-badge";
import { PublishDialog } from "@/components/studio/publish-dialog";
import { fmtDayTime } from "@/components/studio/status";
import { useToast } from "@/components/studio/toast";
import { cn } from "@/lib/cn";
import { NETWORK_KEYS, NETWORKS, type SocialNetwork } from "@/lib/social";
import type { PostView } from "@/lib/social-data";
import { deleteSocialPost, duplicatePost, restoreSocialPost } from "../../../social-actions";

const TABS = [
  { key: "due", label: "À publier" },
  { key: "scheduled", label: "Programmées" },
  { key: "draft", label: "Brouillons" },
  { key: "published", label: "Publiées" },
  { key: "all", label: "Toutes" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const inTab = (p: PostView, t: Tab) =>
  t === "all" ? true : t === "due" ? p.due : t === "scheduled" ? p.status === "scheduled" && !p.due : p.status === t;

const STATUS: Record<string, { label: string; bg: string }> = {
  due: { label: "À publier", bg: "color-mix(in srgb, var(--accent) 22%, transparent)" },
  scheduled: { label: "Programmée", bg: "var(--blob-c)" },
  draft: { label: "Brouillon", bg: "var(--muted)" },
  published: { label: "Publiée", bg: "var(--blob-b)" },
};

const grid = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 nav:grid-cols-[96px_minmax(0,1fr)_170px_120px_170px]";

export function PostsTable({ posts, initialTab, openId }: { posts: PostView[]; initialTab: string | null; openId: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const due = posts.filter((p) => p.due).length;
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.key === initialTab) ? (initialTab as Tab) : due ? "due" : "all");
  const [net, setNet] = useState<"all" | SocialNetwork>("all");
  const [open, setOpen] = useState<string | null>(openId);
  const [pending, start] = useTransition();
  const shown = posts.filter((p) => inTab(p, tab) && (net === "all" || p.networks.includes(net)));
  const openPost = posts.find((p) => p.id === open) ?? null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Statut" className="hairline flex flex-wrap gap-1 rounded-full border bg-card p-1">
          {TABS.map((t) => {
            const count = posts.filter((p) => inTab(p, t.key)).length;
            return (
              <button
                key={t.key}
                role="tab"
                type="button"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors",
                  tab === t.key ? "bg-ink text-card" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t.label}
                <span className={cn("font-mono text-[11px]", t.key === "due" && count ? "rounded-full bg-accent px-1.5 text-white opacity-100" : "opacity-75")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <select
          aria-label="Filtrer par réseau"
          className="field min-h-11 w-auto min-w-[180px] rounded-full bg-card py-2 text-sm"
          value={net}
          onChange={(e) => setNet(e.target.value as typeof net)}
        >
          <option value="all">Tous les réseaux</option>
          {NETWORK_KEYS.map((n) => (
            <option key={n} value={n}>
              {NETWORKS[n].name}
            </option>
          ))}
        </select>
      </div>

      <div className={cn("hairline overflow-hidden rounded-[20px] border bg-card transition-opacity", pending && "opacity-70")}>
        <div className={cn(grid, "label bg-surface px-5 py-3.5 text-[11px] text-muted-foreground")}>
          <span className="hidden nav:block">Réseaux</span>
          <span>Publication</span>
          <span className="hidden nav:block">Date</span>
          <span className="hidden nav:block">Statut</span>
          <span className="text-right">Actions</span>
        </div>
        {shown.map((p) => {
          const status = STATUS[p.due ? "due" : p.status];
          return (
            <motion.div key={p.id} layout transition={{ duration: 0.25, ease: EASE }} className={cn(grid, "hairline border-t px-5 py-3.5")}>
              <span className="hidden gap-1 nav:flex">
                {p.networks.map((n) => (
                  <NetBadge key={n} network={n} dim={p.status === "scheduled" && !!p.published[n]} />
                ))}
                {!p.networks.length && <span className="text-xs text-muted-foreground">-</span>}
              </span>
              <div className="flex min-w-0 items-center gap-3">
                {p.media[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.media[0]} alt="" className="size-11 flex-none rounded-lg object-cover" />
                )}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <Link href={`/studio/social/compose?id=${p.id}`} className="line-clamp-2 text-sm font-medium leading-snug hover:text-accent-ink">
                    {p.text || <span className="text-muted-foreground">(sans texte)</span>}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {p.media.length ? `${p.media.length} image${p.media.length > 1 ? "s" : ""}` : "Texte seul"}
                    {p.link ? " · lien" : ""}
                    {Object.keys(p.custom).length ? " · adapté par réseau" : ""}
                  </span>
                </div>
              </div>
              <span className="hidden font-mono text-xs text-muted-foreground nav:block">{p.scheduledAt ? fmtDayTime(p.scheduledAt) : "-"}</span>
              <span className="hidden nav:block">
                <span className="inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold" style={{ background: status.bg }}>
                  {status.label}
                </span>
              </span>
              <div className="flex justify-end gap-1.5">
                {p.status !== "draft" && p.status !== "published" && (
                  <button
                    type="button"
                    className={cn("btn min-h-10 px-3.5 text-sm", p.due ? "btn-primary" : "btn-ghost")}
                    onClick={() => setOpen(p.id)}
                    title="Copier et ouvrir chaque réseau"
                  >
                    <Send size={15} aria-hidden />
                    Publier
                  </button>
                )}
                <Link href={`/studio/social/compose?id=${p.id}`} className="icon-btn size-10" aria-label="Modifier" title="Modifier">
                  <PenLine size={16} aria-hidden />
                </Link>
                <button
                  type="button"
                  className="icon-btn hidden size-10 nav:inline-flex"
                  aria-label="Dupliquer"
                  title="Dupliquer en brouillon"
                  onClick={() =>
                    start(async () => {
                      const res = await duplicatePost(p.id);
                      if (!res.ok) return toast(res.error, { tone: "error" });
                      toast("Copie ajoutée aux brouillons");
                    })
                  }
                >
                  <Copy size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  className="icon-btn size-10 hover:border-danger! hover:bg-danger!"
                  aria-label="Supprimer"
                  title="Supprimer"
                  onClick={() =>
                    start(async () => {
                      await deleteSocialPost(p.id);
                      toast("Publication supprimée", {
                        undo: () =>
                          start(async () => {
                            await restoreSocialPost(p.id);
                            toast("Publication restaurée");
                          }),
                      });
                    })
                  }
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            </motion.div>
          );
        })}
        {shown.length === 0 && (
          <div className="hairline flex flex-col items-center gap-3.5 border-t px-6 py-16 text-center">
            <span className="display text-[32px]">Rien ici</span>
            <p className="m-0 text-muted-foreground">Aucune publication dans cette vue.</p>
            <Link href="/studio/social/compose" className="btn btn-primary">
              Composer
            </Link>
          </div>
        )}
      </div>

      <PublishDialog
        post={openPost}
        onClose={() => {
          setOpen(null);
          router.replace("/studio/social/posts", { scroll: false });
        }}
      />
    </>
  );
}
