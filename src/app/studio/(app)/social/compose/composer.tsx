"use client";

import { Check, ImageUp, Info, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition, type ChangeEvent } from "react";
import { EASE } from "@/components/motion/ease";
import { NetBadge } from "@/components/studio/net-badge";
import { useFeatures } from "@/components/studio/features";
import { StudioTopBar } from "@/components/studio/page-header";
import { fmtDayTime, toLocalInput } from "@/components/studio/status";
import { useToast } from "@/components/studio/toast";
import { cn } from "@/lib/cn";
import {
  charCount,
  checks,
  DAY_SHORT,
  finalText,
  NETWORK_KEYS,
  NETWORKS,
  nextSlot,
  textFor,
  type Draft,
  type SocialNetwork,
  type SocialSettings,
} from "@/lib/social";
import type { PostView } from "@/lib/social-data";
import { uploadImage } from "../../../actions";
import { draftSocialPostsFromNote } from "../../../ai-actions";
import { saveSocialPost } from "../../../social-actions";

type Mode = "schedule" | "queue" | "now";
type NoteOption = { id: string; title: string; text: string; link: string; cover: string | null };

const field = "field min-h-11 rounded-xl py-2 text-[15px]";

export function Composer({
  post,
  notes,
  slots,
  initialNote,
}: {
  post: PostView | null;
  notes: NoteOption[];
  slots: SocialSettings["slots"];
  initialNote: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const startNote = !post && initialNote ? notes.find((n) => n.id === initialNote) : undefined;

  const [d, setD] = useState<Draft & { noteId: string | null }>({
    networks: post?.networks ?? ["linkedin", "x"],
    text: post?.text ?? startNote?.text ?? "",
    custom: post?.custom ?? {},
    link: post?.link ?? startNote?.link ?? "",
    firstComment: post?.firstComment ?? "",
    media: post?.media ?? (startNote?.cover ? [startNote.cover] : []),
    noteId: post?.noteId ?? startNote?.id ?? null,
  });
  const [tab, setTab] = useState<"all" | SocialNetwork>("all");
  const [preview, setPreview] = useState<SocialNetwork>(d.networks[0] ?? "linkedin");
  const [mode, setMode] = useState<Mode>("schedule");
  const initialAt = post?.scheduledAt && new Date(post.scheduledAt) > new Date() ? post.scheduledAt : nextSlot(d.networks, slots);
  const [when, setWhen] = useState(toLocalInput(initialAt)); // "YYYY-MM-DDTHH:mm" in Douala time
  const [done, setDone] = useState<{ kind: "schedule" | "queue" | "draft"; at: string | null } | null>(null);
  const [saving, start] = useTransition();
  const [uploading, startUpload] = useTransition();
  const [drafting, startDraft] = useTransition();
  const { ai } = useFeatures();
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<typeof d>) => setD((x) => ({ ...x, ...patch }));
  const activeTab = tab !== "all" && !d.networks.includes(tab) ? "all" : tab;
  const isCustom = activeTab !== "all" && d.custom[activeTab] !== undefined;
  const list = useMemo(() => checks(d), [d]);
  const errors = list.filter((c) => c.level === "error");
  const warnings = list.filter((c) => c.level === "warn");
  const pv = d.networks.includes(preview) ? preview : d.networks[0];

  const toggleNetwork = (n: SocialNetwork) =>
    set({ networks: d.networks.includes(n) ? d.networks.filter((x) => x !== n) : NETWORK_KEYS.filter((k) => k === n || d.networks.includes(k)) });

  const onText = (value: string) => {
    if (activeTab === "all" || !isCustom) set({ text: value });
    else set({ custom: { ...d.custom, [activeTab]: value } });
  };

  const toggleCustom = (on: boolean) => {
    if (activeTab === "all") return;
    const custom = { ...d.custom };
    if (on) custom[activeTab] = d.text;
    else delete custom[activeTab];
    set({ custom });
  };

  const importNote = (id: string) => {
    const n = notes.find((x) => x.id === id);
    if (!n) return set({ noteId: null });
    set({ noteId: n.id, text: n.text, link: n.link, custom: {}, media: n.cover && !d.media.length ? [n.cover] : d.media });
  };

  /** Claude writes one version per network from the chosen note. */
  const draftWithClaude = (lang: "fr" | "en") => {
    if (!d.noteId) return;
    if ((d.text.trim() || Object.keys(d.custom).length) && !window.confirm("Remplacer le texte actuel par les propositions de Claude ?")) return;
    startDraft(async () => {
      const res = await draftSocialPostsFromNote(d.noteId!, lang);
      if (!res.ok) return toast(res.error, { tone: "error" });
      const link = lang === "fr" ? d.link : d.link.replace("/fr/blog/", "/blog/");
      set({ text: res.data!.linkedin, custom: { x: res.data!.x, instagram: res.data!.instagram }, link });
      toast("Brouillons rédigés : un texte par réseau, à relire");
    });
  };

  function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    startUpload(async () => {
      const urls: string[] = [];
      for (const file of files) {
        const form = new FormData();
        form.set("file", file);
        const res = await uploadImage(form);
        if (res.ok) urls.push(res.data!.url);
        else toast(res.error, { tone: "error" });
      }
      if (urls.length) set({ media: [...d.media, ...urls].slice(0, 20) });
    });
  }

  function submit(kind: Mode | "draft") {
    start(async () => {
      const res = await saveSocialPost({
        id: post?.id ?? null,
        networks: d.networks,
        text: d.text,
        custom: d.custom,
        link: d.link.trim(),
        firstComment: d.firstComment,
        media: d.media,
        noteId: d.noteId,
        mode: kind,
        scheduledAt: kind === "schedule" && when ? new Date(`${when}:00+01:00`).toISOString() : null,
      });
      if (!res.ok) return toast(res.error, { tone: "error" });
      if (kind === "now") {
        router.push(`/studio/social/posts?statut=due&open=${res.data!.id}`);
        return;
      }
      setDone({ kind, at: res.data!.scheduledAt });
    });
  }

  // Suggested slots for the selected networks (deduplicated).
  const slotChips = useMemo(() => {
    const seen = new Set<string>();
    return d.networks
      .flatMap((n) => slots[n] ?? [])
      .filter((s) => {
        const k = `${s.day}-${s.time}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))
      .map((s) => ({ label: `${DAY_SHORT[s.day]} ${s.time}`, at: nextSlot(["linkedin"], { linkedin: [s], x: [], instagram: [] }) }));
  }, [d.networks, slots]);

  if (done) {
    const n = d.networks.length;
    return (
      <>
        <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Réseaux sociaux", href: "/studio/social" }, { label: "Composer" }]} />
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-col items-start gap-5 px-[clamp(24px,3vw,40px)] py-20"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-blob-b">
            <Check size={28} aria-hidden />
          </span>
          <h1 className="display text-[64px]">
            {done.kind === "draft" ? "Brouillon enregistré" : "Programmé"}
            <span className="text-accent">.</span>
          </h1>
          <p className="m-0 max-w-[560px] text-[17px] leading-relaxed text-muted-foreground">
            {done.kind === "draft"
              ? "Il vous attend dans la file d'attente du calendrier."
              : `Publication prévue sur ${n} réseau${n > 1 ? "x" : ""} le ${fmtDayTime(done.at!)}. À l'heure dite, elle passe dans « À publier » : un clic pour copier le texte et ouvrir chaque réseau.`}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/studio/social/calendar" className="btn btn-primary">
              Voir le calendrier
            </Link>
            <Link href="/studio/social/posts" className="btn btn-ghost">
              Toutes les publications
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (post) return router.push("/studio/social/compose");
                setD({ networks: d.networks, text: "", custom: {}, link: "", firstComment: "", media: [], noteId: null });
                setDone(null);
              }}
            >
              Nouvelle publication
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Réseaux sociaux", href: "/studio/social" }, { label: post ? "Modifier" : "Composer" }]}>
        <span className="text-[13px] text-muted-foreground">Heure de Douala (UTC+1)</span>
      </StudioTopBar>

      <div className="flex flex-col gap-5 p-[clamp(24px,3vw,40px)]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex flex-col gap-3">
            <span className="label text-accent-ink">Réseaux sociaux · {post ? "Modifier" : "Créer"}</span>
            <h1 className="display text-[clamp(44px,5vw,72px)]">
              Composer<span className="text-accent">.</span>
            </h1>
          </div>
          <div className="flex min-w-[260px] flex-col gap-1.5">
            <label className="text-[13px] font-semibold" htmlFor="imp">
              Partir d&apos;une note du blog
            </label>
            <select id="imp" className={field} value={d.noteId ?? ""} onChange={(e) => importNote(e.target.value)}>
              <option value="">Choisir une note</option>
              {notes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
            {ai && d.noteId && (
              <div className="flex flex-wrap items-center gap-2 pt-1" aria-busy={drafting}>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
                  <Sparkles size={14} aria-hidden />
                  Rédiger avec Claude
                </span>
                {(["fr", "en"] as const).map((l) => (
                  <button key={l} type="button" className="btn btn-ghost min-h-10 px-3.5 text-[13px]" disabled={drafting} onClick={() => draftWithClaude(l)}>
                    {drafting ? "Rédaction…" : l === "fr" ? "En français" : "In English"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-5">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
            {/* 1. Networks */}
            <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-base font-bold">1. Où publier ?</h2>
                <Link href="/studio/social/accounts" className="text-[13px] font-semibold underline underline-offset-[3px]">
                  Gérer les comptes
                </Link>
              </div>
              <div role="group" aria-label="Réseaux" className="flex flex-wrap gap-2">
                {NETWORK_KEYS.map((n) => {
                  const on = d.networks.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleNetwork(n)}
                      className={cn(
                        "inline-flex min-h-11 items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-sm font-semibold transition-colors",
                        on ? "border-ink bg-ink text-card" : "border-ink/18 hover:border-ink",
                      )}
                    >
                      <NetBadge network={n} size={30} className="rounded-full" />
                      {NETWORKS[n].name}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2. Text */}
            <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="m-0 text-base font-bold">2. Texte</h2>
                <div role="tablist" aria-label="Version du texte" className="hairline flex flex-wrap gap-1 rounded-full border bg-background p-1">
                  {(["all", ...d.networks] as const).map((k) => (
                    <button
                      key={k}
                      role="tab"
                      type="button"
                      aria-selected={activeTab === k}
                      onClick={() => setTab(k)}
                      className={cn(
                        "relative inline-flex min-h-9 items-center rounded-full px-3.5 text-[13px] font-medium",
                        activeTab === k ? "text-card" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {activeTab === k && <motion.span layoutId="compose-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ duration: 0.25, ease: EASE }} />}
                      <span className="relative">
                        {k === "all" ? "Texte commun" : NETWORKS[k].name}
                        {k !== "all" && d.custom[k] !== undefined ? " •" : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-[13px] text-muted-foreground">
                {activeTab === "all"
                  ? "Ce texte est utilisé partout, sauf là où vous l'adaptez."
                  : isCustom
                    ? `Version adaptée pour ${NETWORKS[activeTab].name}. Les autres réseaux gardent le texte commun.`
                    : `${NETWORKS[activeTab].name} utilise le texte commun. Cochez la case pour l'adapter.`}
              </span>
              {activeTab !== "all" && (
                <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm font-medium">
                  <input type="checkbox" className="size-[18px] accent-ink" checked={isCustom} onChange={(e) => toggleCustom(e.target.checked)} />
                  Adapter le texte pour {NETWORKS[activeTab].name}
                </label>
              )}
              <label htmlFor="txt" className="sr-only">
                Texte de la publication
              </label>
              <textarea
                id="txt"
                rows={7}
                className="field resize-y rounded-xl py-3 text-[15px] leading-relaxed disabled:opacity-60"
                placeholder="Qu'avez-vous à partager ?"
                value={activeTab === "all" ? d.text : textFor(d, activeTab)}
                disabled={activeTab !== "all" && !isCustom}
                onChange={(e) => onText(e.target.value)}
              />
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                {d.networks.map((n) => {
                  const len = charCount(d, n);
                  const pct = Math.min(100, (len / NETWORKS[n].limit) * 100);
                  const over = len > NETWORKS[n].limit;
                  return (
                    <div key={n} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2 font-medium">
                          <NetBadge network={n} size={20} />
                          {NETWORKS[n].name}
                        </span>
                        <span className={cn("font-mono text-xs", over ? "font-semibold text-danger" : "text-muted-foreground")}>
                          {len} / {NETWORKS[n].limit}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className={cn("h-1.5 rounded-full", over ? "bg-danger" : pct > 85 ? "bg-accent" : "bg-success")}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.25 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold" htmlFor="lnk">
                    Lien
                  </label>
                  <input id="lnk" type="url" className={field} placeholder="https://…/blog/…" value={d.link} onChange={(e) => set({ link: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold" htmlFor="fc">
                    Premier commentaire <span className="font-normal text-muted-foreground">(LinkedIn, Instagram)</span>
                  </label>
                  <input id="fc" className={field} placeholder="Ex. : le lien ou les hashtags" value={d.firstComment} onChange={(e) => set({ firstComment: e.target.value })} />
                </div>
              </div>
            </section>

            {/* 3. Media */}
            <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
              <h2 className="m-0 text-base font-bold">3. Médias</h2>
              <div className="flex flex-wrap gap-2.5">
                <AnimatePresence initial={false}>
                  {d.media.map((src, i) => (
                    <motion.figure
                      key={src}
                      layout
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      className="relative m-0 size-[96px] overflow-hidden rounded-xl border border-ink/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Image ${i + 1}`} className="size-full object-cover" />
                      <button
                        type="button"
                        aria-label={`Retirer l'image ${i + 1}`}
                        className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-ink/80 text-card"
                        onClick={() => set({ media: d.media.filter((x) => x !== src) })}
                      >
                        <X size={14} aria-hidden />
                      </button>
                    </motion.figure>
                  ))}
                </AnimatePresence>
                <button type="button" className="btn btn-ghost h-[96px] border-dashed text-sm" disabled={uploading} onClick={() => fileInput.current?.click()}>
                  <ImageUp size={16} aria-hidden />
                  {uploading ? "Envoi…" : "Ajouter une image"}
                </button>
                <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onUpload} />
              </div>
              <span className="text-xs text-muted-foreground">JPG, PNG ou WebP, 5 Mo maximum. Les images sont à recadrer dans l&apos;app au moment de publier.</span>
            </section>

            {/* 4. When */}
            <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="m-0 text-base font-bold">4. Quand ?</h2>
                <div role="radiogroup" aria-label="Moment de publication" className="hairline flex flex-wrap gap-1 rounded-full border bg-background p-1">
                  {(
                    [
                      ["schedule", "Programmer"],
                      ["queue", "Prochain créneau"],
                      ["now", "Maintenant"],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      role="radio"
                      type="button"
                      aria-checked={mode === k}
                      onClick={() => setMode(k)}
                      className={cn("min-h-9 rounded-full px-3.5 text-[13px] font-medium", mode === k ? "bg-ink text-card" : "text-muted-foreground hover:text-foreground")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {mode === "schedule" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold" htmlFor="dt">
                      Date et heure
                    </label>
                    <input id="dt" type="datetime-local" className={cn(field, "max-w-[280px]")} value={when} onChange={(e) => setWhen(e.target.value)} />
                  </div>
                  {slotChips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                      <span>Créneaux conseillés :</span>
                      {slotChips.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          className="min-h-8 rounded-full border border-ink/18 px-3 text-xs font-semibold text-foreground hover:border-ink"
                          onClick={() => setWhen(toLocalInput(s.at))}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {mode === "queue" && (
                <p className="m-0 text-sm text-muted-foreground">
                  Placée sur le prochain créneau libre de vos réseaux (vers le {fmtDayTime(nextSlot(d.networks, slots))}).
                </p>
              )}
              {mode === "now" && (
                <p className="m-0 flex items-start gap-2 text-sm text-muted-foreground">
                  <Info size={16} className="mt-0.5 flex-none" aria-hidden />
                  Les réseaux ne sont pas encore connectés par API : « Publier » ouvre l&apos;assistant pour copier le texte et ouvrir chaque réseau.
                </p>
              )}
            </section>
          </div>

          {/* Side: checks, preview, actions */}
          <aside className="flex flex-[1_1_340px] flex-col gap-4 nav:sticky nav:top-6">
            <section className="hairline flex flex-col gap-2.5 rounded-[20px] border bg-card p-[22px]">
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-base font-bold">Contrôles par réseau</h2>
                <span
                  className="inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold"
                  style={{ background: errors.length ? "color-mix(in srgb, var(--danger) 15%, transparent)" : warnings.length ? "var(--blob-c)" : "var(--blob-b)" }}
                >
                  {errors.length ? `${errors.length} à corriger` : warnings.length ? `${warnings.length} conseil${warnings.length > 1 ? "s" : ""}` : "Tout est prêt"}
                </span>
              </div>
              {!d.networks.length && <span className="text-sm text-muted-foreground">Sélectionnez au moins un réseau.</span>}
              {list.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px] leading-snug">
                  <span
                    aria-hidden
                    className="mt-px inline-flex size-5 flex-none items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: c.level === "error" ? "var(--danger)" : c.level === "warn" ? "var(--accent-ink)" : "var(--success)" }}
                  >
                    {c.level === "error" ? "!" : c.level === "warn" ? "i" : "✓"}
                  </span>
                  <span>
                    <b>{NETWORKS[c.network].name}</b> : {c.message}
                  </span>
                </div>
              ))}
            </section>

            <section className="hairline flex flex-col gap-3 rounded-[20px] border bg-card p-[22px]">
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-base font-bold">Aperçu</h2>
                <div className="flex gap-1">
                  {d.networks.map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={pv === n}
                      aria-label={`Aperçu ${NETWORKS[n].name}`}
                      onClick={() => setPreview(n)}
                      className={cn("rounded-lg p-0.5", pv === n ? "ring-2 ring-ink" : "opacity-60 hover:opacity-100")}
                    >
                      <NetBadge network={n} size={26} />
                    </button>
                  ))}
                </div>
              </div>
              {pv ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={pv}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-4 text-[#0f1419]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-10 items-center justify-center rounded-full bg-blob-b text-sm font-bold text-ink">PL</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Patrick Loic</span>
                        <span className="text-xs text-[#536471]">{pv === "x" ? "@patrickloic · maintenant" : pv === "linkedin" ? "Digital Consultant · maintenant" : "patrickloic"}</span>
                      </div>
                    </div>
                    {pv === "instagram" && d.media[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.media[0]} alt="" className="aspect-square w-full rounded-lg object-cover" />
                    )}
                    <p className="m-0 whitespace-pre-line break-words text-sm leading-relaxed">
                      {(() => {
                        const t = finalText(d, pv);
                        const fold = NETWORKS[pv].fold;
                        return fold && t.length > fold ? (
                          <>
                            {t.slice(0, fold)}… <span className="text-[#536471]">voir plus</span>
                          </>
                        ) : (
                          t || <span className="text-[#536471]">Votre texte apparaîtra ici.</span>
                        );
                      })()}
                    </p>
                    {pv !== "instagram" && d.media[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.media[0]} alt="" className="max-h-[220px] w-full rounded-lg object-cover" />
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <span className="text-sm text-muted-foreground">Choisissez un réseau pour voir l&apos;aperçu.</span>
              )}
            </section>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="btn btn-primary min-h-12 disabled:opacity-50"
                disabled={saving || errors.length > 0 || !d.networks.length}
                onClick={() => submit(mode)}
              >
                {saving ? "Enregistrement…" : mode === "now" ? "Publier maintenant" : mode === "queue" ? "Ajouter au prochain créneau" : "Programmer"}
              </button>
              {errors.length > 0 && (
                <span role="alert" className="text-center text-xs font-medium text-danger">
                  Corrigez les points en rouge pour programmer.
                </span>
              )}
              <button type="button" className="btn btn-ghost min-h-11 text-sm" disabled={saving} onClick={() => submit("draft")}>
                Enregistrer en brouillon
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
