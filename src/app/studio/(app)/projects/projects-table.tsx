"use client";

import { ChevronDown, ChevronUp, ExternalLink, GripVertical, PenLine, Star, Trash2 } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition, type PointerEvent, type ReactNode } from "react";
import { EASE } from "@/components/motion/ease";
import { Switch } from "@/components/studio/switch";
import { useToast } from "@/components/studio/toast";
import { cn } from "@/lib/cn";
import { toneOf } from "@/lib/tones";
import { deleteProject, moveProject, reorderProjects, restoreProject, setProjectFlags } from "../../portfolio-actions";

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: "professional" | "community" | "personal";
  openSource: boolean;
  status: "draft" | "published";
  tags: string[];
  tone: string;
  cover: string | null;
  featured: boolean;
  visible: boolean;
};

const MAX = 5;
const TABS = [
  { key: "all", label: "Tous" },
  { key: "professional", label: "Professionnels" },
  { key: "community", label: "Communauté" },
  { key: "personal", label: "Persos" },
] as const;

const TYPE_BADGE: Record<Row["type"], { label: string; bg: string }> = {
  professional: { label: "Pro", bg: "var(--muted)" },
  community: { label: "Communauté", bg: "var(--secondary)" },
  personal: { label: "Perso", bg: "var(--blob-c)" },
};

const grid =
  "grid grid-cols-[64px_minmax(0,1fr)_52px] items-center gap-4 nav:grid-cols-[64px_56px_minmax(0,2.4fr)_minmax(0,1.2fr)_110px_72px_72px_140px]";

export function ProjectsTable({ projects }: { projects: Row[] }) {
  const toast = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [pending, start] = useTransition();
  const [list, update] = useOptimistic(projects, (rows: Row[], patch: { id: string } & Partial<Row>) =>
    rows.map((r) => (r.id === patch.id ? { ...r, ...patch } : r)),
  );
  const featuredCount = list.filter((r) => r.featured).length;
  const inTab = (r: Row) => tab === "all" || r.type === tab;

  // While dragging (and until the save lands) rows follow the local order.
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const pendingOrder = useRef<string[] | null>(null);
  const byId = new Map(list.map((r) => [r.id, r]));
  const ordered = dragOrder ? [...dragOrder.flatMap((id) => byId.get(id) ?? []), ...list.filter((r) => !dragOrder.includes(r.id))] : list;
  const shown = ordered.filter(inTab);
  const dragging = dragOrder !== null;

  /** Reordering a filtered tab only shuffles those rows among their own slots. */
  const onReorder = (next: Row[]) => {
    const ids = ordered.map((r) => r.id);
    const queue = [...next];
    ordered.forEach((r, i) => {
      if (inTab(r)) ids[i] = queue.shift()!.id;
    });
    pendingOrder.current = ids;
    setDragOrder(ids);
  };

  const commitOrder = () => {
    const ids = pendingOrder.current;
    pendingOrder.current = null;
    if (!ids) return;
    if (ids.join() === list.map((r) => r.id).join()) return setDragOrder(null);
    start(async () => {
      const res = await reorderProjects(ids);
      if (!res.ok) toast(res.error ?? "Erreur", { tone: "error" });
      else toast("Ordre enregistré");
      setDragOrder(null);
    });
  };

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok?: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast(res.error ?? "Erreur", { tone: "error" });
      else if (ok) toast(ok);
    });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Type" className="hairline flex flex-wrap gap-1 rounded-full border bg-card p-1">
          {TABS.map((t) => (
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
              <span className="font-mono text-[11px] opacity-75">{list.filter((r) => t.key === "all" || r.type === t.key).length}</span>
            </button>
          ))}
        </div>
        <span
          className="inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold"
          style={{
            background: featuredCount >= MAX ? "var(--blob-c)" : "var(--secondary)",
          }}
        >
          {featuredCount} / {MAX} à la une
        </span>
      </div>

      <div className={cn("hairline overflow-hidden rounded-[20px] border bg-card transition-opacity", pending && "opacity-70")}>
        <div className={cn(grid, "label bg-surface px-5 py-3.5 text-[11px] text-muted-foreground")}>
          <span>Ordre</span>
          <span className="hidden nav:block" />
          <span>Projet</span>
          <span className="hidden nav:block">Stack</span>
          <span className="hidden nav:block">Type</span>
          <span className="hidden nav:block">À la une</span>
          <span>Visible</span>
          <span className="hidden text-right nav:block">Actions</span>
        </div>

        <Reorder.Group as="div" axis="y" values={shown} onReorder={onReorder}>
          {shown.map((r) => {
            const index = ordered.indexOf(r);
            return (
              <DraggableRow key={r.id} value={r} onDrop={commitOrder} className={cn(grid, "hairline border-t bg-card px-5 py-3.5 hover:bg-surface")}>
                {(startDrag) => (
                  <>
                    <div className="flex items-center gap-1">
                      <span
                        className="inline-flex h-11 w-6 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
                        title="Glisser pour réordonner"
                        aria-hidden
                        onPointerDown={startDrag}
                      >
                        <GripVertical size={16} />
                      </span>
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25"
                          aria-label={`Monter ${r.name}`}
                          disabled={index === 0 || pending || dragging}
                          onClick={() => run(() => moveProject(r.id, -1))}
                        >
                          <ChevronUp size={16} aria-hidden />
                        </button>
                        <span className="font-mono text-[11px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                        <button
                          type="button"
                          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25"
                          aria-label={`Descendre ${r.name}`}
                          disabled={index === ordered.length - 1 || pending || dragging}
                          onClick={() => run(() => moveProject(r.id, 1))}
                        >
                          <ChevronDown size={16} aria-hidden />
                        </button>
                      </div>
                    </div>
                    <span
                      className="hidden h-11 w-14 rounded-[10px] border border-ink/8 nav:block"
                      style={{
                        background: r.cover ? `center/cover url(${r.cover})` : toneOf(r.tone).bg,
                      }}
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <Link
                          href={`/studio/projects/${r.id}`}
                          className="truncate text-[15px] font-bold hover:text-accent-ink hover:underline hover:underline-offset-[3px]"
                        >
                          {r.name}
                        </Link>
                        {r.status === "draft" && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Brouillon</span>
                        )}
                      </span>
                      <span className="truncate text-[13px] text-muted-foreground">{r.description}</span>
                    </div>
                    <span className="hidden truncate text-[13px] text-muted-foreground nav:block">{r.tags.join(" · ")}</span>
                    <span className="hidden nav:block">
                      <span
                        className="inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold"
                        style={{ background: TYPE_BADGE[r.type].bg }}
                        title={r.type === "personal" ? (r.openSource ? "Projet perso open source" : "Projet perso, code privé") : undefined}
                      >
                        {TYPE_BADGE[r.type].label}
                        {r.type === "personal" && <span className="ml-1 font-mono text-[10px] opacity-70">{r.openSource ? "OSS" : "privé"}</span>}
                      </span>
                    </span>
                    <span className="hidden nav:block">
                      <button
                        type="button"
                        aria-pressed={r.featured}
                        aria-label={`${r.featured ? "Retirer" : "Mettre"} ${r.name} ${r.featured ? "de" : "à"} la une`}
                        title={r.featured ? "À la une" : "Mettre à la une"}
                        className={cn(
                          "inline-flex size-10 items-center justify-center rounded-full border transition-colors",
                          r.featured ? "border-accent/40 bg-accent/10 text-accent" : "border-ink/18 text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => {
                          if (!r.featured && featuredCount >= MAX)
                            return toast(`${MAX} projets maximum à la une, retirez-en un d'abord`, { tone: "error" });
                          run(async () => {
                            update({ id: r.id, featured: !r.featured });
                            return setProjectFlags(r.id, {
                              featured: !r.featured,
                            });
                          });
                        }}
                      >
                        <Star size={16} fill={r.featured ? "currentColor" : "none"} aria-hidden />
                      </button>
                    </span>
                    <Switch
                      checked={r.visible}
                      label={`Afficher ${r.name} sur le site`}
                      onChange={(visible) =>
                        run(
                          async () => {
                            update({ id: r.id, visible });
                            return setProjectFlags(r.id, { visible });
                          },
                          `${r.name} ${visible ? "visible sur le site" : "masqué du site"}`,
                        )
                      }
                    />
                    <div className="hidden justify-end gap-1.5 nav:flex">
                      <Link href={`/studio/projects/${r.id}`} className="icon-btn size-10" aria-label={`Éditer ${r.name}`} title="Éditer">
                        <PenLine size={16} aria-hidden />
                      </Link>
                      {r.visible && r.status === "published" ? (
                        <a
                          href={`/work/${r.slug}`}
                          target="_blank"
                          className="icon-btn size-10"
                          aria-label={`Voir ${r.name} sur le site`}
                          title="Voir"
                        >
                          <ExternalLink size={16} aria-hidden />
                        </a>
                      ) : (
                        <span className="size-10" />
                      )}
                      <button
                        type="button"
                        className="icon-btn size-10 hover:border-danger! hover:bg-danger!"
                        aria-label={`Supprimer ${r.name}`}
                        title="Supprimer"
                        onClick={() =>
                          start(async () => {
                            const res = await deleteProject(r.id);
                            if (!res.ok) return toast(res.error, { tone: "error" });
                            toast("Projet supprimé", {
                              undo: () =>
                                start(async () => {
                                  await restoreProject(r.id);
                                  toast("Projet restauré");
                                }),
                            });
                          })
                        }
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </div>
                  </>
                )}
              </DraggableRow>
            );
          })}
        </Reorder.Group>

        {shown.length === 0 && (
          <div className="hairline flex flex-col items-center gap-3.5 border-t px-6 py-16 text-center">
            <span className="display text-[32px]">Aucun projet</span>
            <Link href="/studio/projects/new" className="btn btn-primary">
              Ajouter un projet
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

/** A table row that only starts dragging from its grip handle. */
function DraggableRow({
  value,
  className,
  onDrop,
  children,
}: {
  value: Row;
  className: string;
  onDrop: () => void;
  children: (startDrag: (e: PointerEvent) => void) => ReactNode;
}) {
  const controls = useDragControls();

  // No text selection while a row is held: cancel the pointer's default
  // (which starts a selection) and lock selection page-wide until release.
  const startDrag = (e: PointerEvent) => {
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    document.documentElement.classList.add("select-none");
    const release = () => document.documentElement.classList.remove("select-none");
    window.addEventListener("pointerup", release, { once: true });
    window.addEventListener("pointercancel", release, { once: true });
    controls.start(e);
  };

  return (
    <Reorder.Item
      as="div"
      value={value}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      transition={{ duration: 0.3, ease: EASE }}
      whileDrag={{
        scale: 1.01,
        boxShadow: "0 18px 40px -18px rgb(37 30 25 / 0.45)",
        zIndex: 10,
        position: "relative",
      }}
      className={className}
    >
      {children(startDrag)}
    </Reorder.Item>
  );
}
