"use client";

import { ImageUp, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";
import { Markdown } from "@/components/blog/markdown";
import { EASE } from "@/components/motion/ease";
import { StudioTopBar } from "@/components/studio/page-header";
import { fmtDay, fromLocalInput, statusMeta, toLocalInput } from "@/components/studio/status";
import { useToast } from "@/components/studio/toast";
import { tones, type Tone } from "@/lib/tones";
import type { NoteStatus } from "@/db/schema";
import { cn } from "@/lib/cn";
import { readingMinutes, slugify, wordCount } from "@/lib/slug";
import { deleteNotes, restoreNotes, saveNote, uploadImage, type NoteInput } from "../../actions";

type Lang = "fr" | "en";
type Text = NoteInput["translations"]["fr"];

export type EditorNote = {
  id: string | null;
  slug: string;
  subjectId: string;
  status: NoteStatus;
  publishedAt: string | null;
  tone: Tone;
  coverUrl: string | null;
  tags: string[];
  featured: boolean;
  updatedAt: string | null;
  translations: Record<Lang, Text>;
};

const COVERS: [Tone, string][] = [
  ["peach", "Pêche"],
  ["leaf", "Feuille"],
  ["sand", "Sable"],
  ["sage", "Sauge"],
  ["terracotta", "Terracotta"],
  ["ink", "Encre"],
];

const TOOLS = [
  { id: "h2", label: "H2", aria: "Intertitre" },
  { id: "bold", label: "B", aria: "Gras" },
  { id: "italic", label: "I", aria: "Italique" },
  { id: "quote", label: "“ ”", aria: "Citation" },
  { id: "list", label: "•", aria: "Liste" },
  { id: "code", label: "</>", aria: "Bloc de code" },
  { id: "link", label: "Lien", aria: "Lien" },
  { id: "tip", label: "Astuce", aria: "Encadré astuce" },
] as const;

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "Français" },
  { key: "en", label: "English" },
];

export function NoteEditor({
  initial,
  subjects,
  ideaId,
}: {
  initial: EditorNote;
  subjects: { id: string; name: string }[];
  ideaId?: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [d, setD] = useState(initial);
  const [lang, setLang] = useState<Lang>("fr");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(initial.updatedAt);
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [uploading, startUpload] = useTransition();
  const body = useRef<HTMLTextAreaElement>(null);
  const isNew = d.id === null;
  const t = d.translations[lang];
  const other: Lang = lang === "fr" ? "en" : "fr";

  const upd = (patch: Partial<EditorNote>) => {
    setD((x) => ({ ...x, ...patch }));
    setDirty(true);
  };
  const updText = (patch: Partial<Text>) => {
    setD((x) => ({ ...x, translations: { ...x.translations, [lang]: { ...x.translations[lang], ...patch } } }));
    setDirty(true);
  };

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  function save(status: NoteStatus) {
    setError(null);
    startSave(async () => {
      const res = await saveNote({
        id: d.id,
        slug: d.slug,
        subjectId: d.subjectId,
        status,
        publishedAt: d.publishedAt,
        tone: d.tone,
        coverUrl: d.coverUrl,
        tags: tagsText.split(",").map((s) => s.trim()).filter(Boolean),
        featured: d.featured,
        ideaId: isNew ? (ideaId ?? null) : null,
        translations: d.translations,
      });
      if (!res.ok) {
        setError(res.error);
        toast(res.error, { tone: "error" });
        return;
      }
      // The server may turn "published + future date" into "scheduled".
      const { id, slug, publishedAt, status: savedStatus } = res.data!;
      status = savedStatus;
      setD((x) => ({ ...x, id, slug, status: savedStatus, publishedAt }));
      setDirty(false);
      setSavedAt(new Date().toISOString());
      toast(
        status === "published"
          ? initial.status === "published" && !isNew
            ? "Note mise à jour"
            : "Note publiée sur le blog"
          : status === "scheduled"
            ? `Publication programmée le ${fmtDay(publishedAt!)}`
            : "Brouillon enregistré",
      );
      if (isNew) router.replace(`/studio/notes/${id}`);
      else router.refresh();
    });
  }

  const primaryStatus: NoteStatus = d.status === "scheduled" ? "scheduled" : "published";
  const primaryLabel = d.status === "scheduled" ? "Programmer" : !isNew && initial.status === "published" ? "Mettre à jour" : "Publier";

  // ⌘S / Ctrl+S saves with the current status.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current(d.status);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [d.status]);

  /** Wrap the selection (or insert at the caret) in the body textarea. */
  function insert(before: string, after = "", placeholder = "") {
    const el = body.current;
    const value = t.body;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const picked = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + picked + after + value.slice(end);
    updText({ body: next });
    requestAnimationFrame(() => {
      el?.focus();
      const s = start + before.length;
      el?.setSelectionRange(s, s + picked.length);
    });
  }

  const block = (prefix: string) => {
    const value = t.body;
    const start = body.current?.selectionStart ?? value.length;
    const lead = start === 0 || value[start - 1] === "\n" ? "" : value.slice(start - 2, start) === "\n\n" ? "" : "\n\n";
    insert(lead + prefix);
  };

  function runTool(id: (typeof TOOLS)[number]["id"]) {
    if (id === "h2") block("## ");
    else if (id === "bold") insert("**", "**", "texte");
    else if (id === "italic") insert("*", "*", "texte");
    else if (id === "quote") block("> ");
    else if (id === "list") block("- ");
    else if (id === "code") insert("\n\n```ts\n", "\n```\n", "code");
    else if (id === "link") insert("[", "](https://)", "texte");
    else if (id === "tip") block("> [!TIP]\n> ");
  }

  const inlineImage = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  function upload(e: ChangeEvent<HTMLInputElement>, onDone: (url: string) => void) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    startUpload(async () => {
      const res = await uploadImage(form);
      if (!res.ok) return toast(res.error, { tone: "error" });
      onDone(res.data!.url);
    });
  }

  const words = wordCount(t.body);
  const minutes = readingMinutes(t.body);
  const tone = tones[d.tone] ?? tones.peach;
  const subject = subjects.find((s) => s.id === d.subjectId)?.name ?? "";
  const status = statusMeta[d.status];
  const slugHint = slugify(d.translations.en.title || d.translations.fr.title) || "mon-article";

  if (deleted) {
    return (
      <>
        <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Notes", href: "/studio/notes" }, { label: "Supprimée" }]} />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-col items-start gap-5 px-10 py-24"
        >
          <span className="label text-accent-ink">Note supprimée</span>
          <h1 className="display text-[64px]">
            C&apos;est fait<span className="text-accent">.</span>
          </h1>
          <p className="m-0 text-[17px] text-muted-foreground">« {d.translations.fr.title || d.translations.en.title || "Sans titre"} » a été retirée du blog.</p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={async () => {
                await restoreNotes([d.id!]);
                setDeleted(false);
                toast("Note restaurée");
                router.refresh();
              }}
            >
              Restaurer la note
            </button>
            <Link href="/studio/notes" className="btn btn-primary">
              Retour à toutes les notes
            </Link>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <StudioTopBar
        crumbs={[{ label: "Studio", href: "/studio" }, { label: "Notes", href: "/studio/notes" }, { label: isNew ? "Nouvelle note" : "Éditer" }]}
      >
        <span role="status" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
          <span className={cn("size-2 rounded-full", dirty ? "bg-accent" : "bg-success")} />
          {saving
            ? "Enregistrement…"
            : dirty
              ? "Modifications non enregistrées"
              : savedAt
                ? `Enregistré · ${new Date(savedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                : "Nouvelle note (non enregistrée)"}
        </span>
        <div role="tablist" aria-label="Mode" className="hairline flex gap-1 rounded-full border bg-card p-1">
          {(["write", "preview"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "relative inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-medium",
                mode === m ? "text-card" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {mode === m && <motion.span layoutId="editor-mode" className="absolute inset-0 rounded-full bg-ink" transition={{ duration: 0.25, ease: EASE }} />}
              <span className="relative">{m === "write" ? "Écrire" : "Aperçu"}</span>
            </button>
          ))}
        </div>
      </StudioTopBar>

      <div className="flex flex-wrap items-start gap-5 p-[clamp(24px,3vw,40px)]">
        {/* Editor -------------------------------------------------- */}
        <section aria-label="Éditeur" className="hairline min-w-0 flex-[999_1_560px] overflow-hidden rounded-[20px] border bg-card">
          <div role="tablist" aria-label="Langue" className="hairline flex items-center gap-1 border-b px-[clamp(14px,2.4vw,32px)] pt-3">
            {LANGS.map((l) => {
              const filled = !!d.translations[l.key].title.trim();
              return (
                <button
                  key={l.key}
                  role="tab"
                  type="button"
                  aria-selected={lang === l.key}
                  onClick={() => setLang(l.key)}
                  className={cn(
                    "relative -mb-px flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors",
                    lang === l.key ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {l.label}
                  <span
                    className={cn("size-1.5 rounded-full", filled ? "bg-success" : "bg-ink/20")}
                    title={filled ? "Version rédigée" : "Pas encore rédigée"}
                  />
                </button>
              );
            })}
            <span className="ml-auto hidden pb-2 text-xs text-muted-foreground sm:block">
              Sans version {lang === "fr" ? "anglaise" : "française"}, le site affiche celle-ci.
            </span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {mode === "write" ? (
              <motion.div key={`write-${lang}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <div className="flex flex-col gap-3.5 px-[clamp(20px,3vw,40px)] pb-5 pt-8">
                  <span className="label text-accent-ink">{isNew ? "Nouvelle note" : `Éditer · ${subject}`}</span>
                  <label htmlFor="ed-title" className="sr-only">
                    Titre
                  </label>
                  <input
                    id="ed-title"
                    lang={lang}
                    className="w-full border-0 bg-transparent p-0 font-display text-[clamp(32px,3.2vw,44px)] font-extrabold leading-[1.05] tracking-[-0.03em] outline-none placeholder:text-ink/35"
                    placeholder={lang === "fr" ? "Titre de la note" : "Note title"}
                    value={t.title}
                    onChange={(e) => updText({ title: e.target.value })}
                  />
                  <label htmlFor="ed-dek" className="sr-only">
                    Chapeau
                  </label>
                  <textarea
                    id="ed-dek"
                    lang={lang}
                    rows={2}
                    className="w-full resize-none border-0 bg-transparent p-0 text-[19px] leading-[1.55] text-muted-foreground outline-none placeholder:text-muted-foreground/70"
                    placeholder="Chapeau : une ou deux phrases qui donnent envie de lire."
                    value={t.dek}
                    onChange={(e) => updText({ dek: e.target.value })}
                  />
                  {!t.title && d.translations[other].title && (
                    <button
                      type="button"
                      className="self-start text-[13px] font-semibold text-accent-ink underline underline-offset-[3px]"
                      onClick={() => updText({ ...d.translations[other] })}
                    >
                      Partir de la version {other === "fr" ? "française" : "anglaise"} pour traduire
                    </button>
                  )}
                </div>
                <div role="toolbar" aria-label="Mise en forme" className="hairline flex flex-wrap gap-0.5 border-y bg-surface px-[clamp(14px,2.4vw,32px)] py-1.5">
                  {TOOLS.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      aria-label={tool.aria}
                      title={tool.aria}
                      onClick={() => runTool(tool.id)}
                      className="h-10 min-w-10 rounded-[10px] px-2.5 font-mono text-[13px] font-medium hover:bg-muted"
                    >
                      {tool.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="Image"
                    title="Insérer une image"
                    onClick={() => inlineImage.current?.click()}
                    disabled={uploading}
                    className="h-10 min-w-10 rounded-[10px] px-2.5 font-mono text-[13px] font-medium hover:bg-muted disabled:opacity-50"
                  >
                    {uploading ? "…" : "Image"}
                  </button>
                  <input
                    ref={inlineImage}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => upload(e, (url) => insert(`\n\n![`, `](${url})\n\n`, "légende"))}
                  />
                </div>
                <div className="px-[clamp(20px,3vw,40px)] py-6">
                  <label htmlFor="ed-body" className="sr-only">
                    Contenu
                  </label>
                  <textarea
                    id="ed-body"
                    ref={body}
                    lang={lang}
                    className="min-h-[460px] w-full resize-y border-0 bg-transparent p-0 text-[17px] leading-[1.75] outline-none placeholder:text-muted-foreground"
                    placeholder="Commencez à écrire… (## pour un intertitre, > pour une citation)"
                    value={t.body}
                    onChange={(e) => updText({ body: e.target.value })}
                  />
                </div>
                <div className="hairline flex flex-wrap justify-between gap-3 border-t px-[clamp(20px,3vw,40px)] py-3.5 font-mono text-xs text-muted-foreground">
                  <span>
                    {words} mots · {minutes} min de lecture
                  </span>
                  <span>Markdown pris en charge · Ctrl+S pour enregistrer</span>
                </div>
              </motion.div>
            ) : (
              <motion.article
                key={`preview-${lang}`}
                lang={lang}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pb-10"
              >
                <div className="relative flex h-[220px] items-end overflow-hidden px-[clamp(20px,3vw,40px)] py-6" style={{ background: tone.bg, color: tone.ink }}>
                  {d.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
                  )}
                  {!d.coverUrl && t.hook && <span className="display absolute right-[clamp(20px,3vw,40px)] top-6 whitespace-pre-line text-right text-[40px]">{t.hook}</span>}
                  <span className="label relative">{subject}</span>
                </div>
                <div className="flex max-w-[760px] flex-col gap-[18px] px-[clamp(20px,3vw,40px)] pt-8">
                  <span className="label text-muted-foreground">
                    {d.publishedAt && d.status !== "draft" ? fmtDay(d.publishedAt) : "Non publiée"} · {minutes} min de lecture
                  </span>
                  <h1 className="m-0 font-display text-[44px] font-extrabold leading-[1.05] tracking-[-0.03em]">{t.title || "Sans titre"}</h1>
                  {t.dek && <p className="m-0 text-[19px] leading-[1.55] text-muted-foreground">{t.dek}</p>}
                  <div className="hairline my-2 border-t" />
                  {t.body.trim() ? (
                    <div className="prose">
                      <Markdown source={t.body} />
                    </div>
                  ) : (
                    <p className="m-0 text-muted-foreground">Le contenu apparaîtra ici.</p>
                  )}
                </div>
              </motion.article>
            )}
          </AnimatePresence>
        </section>

        {/* Side panel ---------------------------------------------- */}
        <aside className="flex flex-[1_1_300px] flex-col gap-4">
          <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-base font-bold">Publication</h2>
              <span className="inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold" style={{ background: status.bg }}>
                {status.label}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor="ed-status">
                Statut
              </label>
              <select
                id="ed-status"
                className="field min-h-11 rounded-xl py-2 text-[15px]"
                value={d.status}
                onChange={(e) => {
                  const status = e.target.value as NoteStatus;
                  // Scheduling needs a future date: start tomorrow at 08:30.
                  if (status === "scheduled" && (!d.publishedAt || new Date(d.publishedAt) <= new Date())) {
                    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
                    upd({ status, publishedAt: fromLocalInput(`${tomorrow}T08:30`) });
                  } else if (status === "published" && d.publishedAt && new Date(d.publishedAt) > new Date()) {
                    // Publishing now: a future date would keep it hidden, so reset it to "now".
                    upd({ status, publishedAt: null });
                  } else upd({ status });
                }}
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publiée</option>
                <option value="scheduled">Programmée</option>
              </select>
            </div>
            <AnimatePresence initial={false}>
              {d.status !== "draft" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-1.5 overflow-hidden"
                >
                  <label className="text-[13px] font-semibold" htmlFor="ed-date">
                    {d.status === "scheduled" ? "Date de publication prévue" : "Date de publication"}
                  </label>
                  <input
                    id="ed-date"
                    type="datetime-local"
                    className="field min-h-11 rounded-xl py-2 text-[15px]"
                    value={toLocalInput(d.publishedAt)}
                    onChange={(e) => upd({ publishedAt: fromLocalInput(e.target.value) })}
                  />
                  <span className="text-xs text-muted-foreground">
                    Heure de Douala (UTC+1){d.status === "published" && !d.publishedAt ? " · vide = maintenant" : ""}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {error && (
              <p role="alert" className="m-0 rounded-xl bg-danger/10 px-3.5 py-2.5 text-[13px] font-medium text-danger">
                {error}
              </p>
            )}
            <div className="mt-1 flex flex-col gap-2">
              <button
                type="button"
                className="btn btn-primary min-h-11 text-sm disabled:opacity-60"
                disabled={saving}
                onClick={() => save(primaryStatus)}
              >
                {primaryLabel}
              </button>
              <button type="button" className="btn btn-ghost min-h-11 text-sm" disabled={saving} onClick={() => save("draft")}>
                Enregistrer en brouillon
              </button>
              {!isNew && d.status === "published" && (
                <a href={`/blog/${d.slug}`} target="_blank" className="text-center text-[13px] font-semibold underline underline-offset-[3px]">
                  Voir sur le blog ↗
                </a>
              )}
            </div>
            {!isNew && (
              <div className="hairline border-t pt-3.5">
                <AnimatePresence mode="wait" initial={false}>
                  {confirming ? (
                    <motion.div
                      key="confirm"
                      role="alertdialog"
                      aria-label="Confirmer la suppression"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-2.5 rounded-[14px] bg-danger/8 p-3.5"
                    >
                      <span className="text-sm font-semibold">Retirer cette note du blog et la mettre à la corbeille ?</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn min-h-10 flex-1 bg-danger text-sm text-card"
                          onClick={async () => {
                            await deleteNotes([d.id!]);
                            setConfirming(false);
                            setDeleted(true);
                          }}
                        >
                          Supprimer
                        </button>
                        <button type="button" className="btn btn-ghost min-h-10 flex-1 text-sm" onClick={() => setConfirming(false)}>
                          Annuler
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="ask"
                      type="button"
                      className="btn min-h-10 w-full border-danger/30 bg-transparent text-sm text-danger hover:bg-danger hover:text-card"
                      onClick={() => setConfirming(true)}
                    >
                      <Trash2 size={15} aria-hidden />
                      Supprimer la note
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}
          </section>

          <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
            <h2 className="m-0 text-base font-bold">Classement</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor="ed-subj">
                Sujet
              </label>
              <select
                id="ed-subj"
                className="field min-h-11 rounded-xl py-2 text-[15px]"
                value={d.subjectId}
                onChange={(e) => upd({ subjectId: e.target.value })}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Link href="/studio/subjects" className="text-xs text-muted-foreground underline underline-offset-[3px]">
                Gérer les sujets
              </Link>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor="ed-tags">
                Tags
              </label>
              <input
                id="ed-tags"
                className="field min-h-11 rounded-xl py-2 text-[15px]"
                placeholder="Angular, NestJS…"
                value={tagsText}
                onChange={(e) => {
                  setTagsText(e.target.value);
                  setDirty(true);
                }}
              />
              <span className="text-xs text-muted-foreground">Séparés par des virgules.</span>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
              <input type="checkbox" className="size-[18px] accent-ink" checked={d.featured} onChange={(e) => upd({ featured: e.target.checked })} />
              Mettre à la une du blog
            </label>
          </section>

          <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
            <h2 className="m-0 text-base font-bold">Couverture</h2>
            <div
              className="relative flex h-24 items-end overflow-hidden rounded-[14px] border border-ink/8 p-3"
              style={{ background: tone.bg, color: tone.ink }}
            >
              {d.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
              )}
              {!d.coverUrl && <span className="display relative whitespace-pre-line text-xl">{t.hook || t.title || "Couverture"}</span>}
            </div>
            <div role="radiogroup" aria-label="Couleur de couverture" className="flex flex-wrap gap-2.5">
              {COVERS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={d.tone === key}
                  aria-label={label}
                  title={label}
                  onClick={() => upd({ tone: key })}
                  className="size-10 rounded-full border border-ink/14"
                  style={{
                    background: tones[key].bg,
                    boxShadow: d.tone === key ? "0 0 0 3px var(--card), 0 0 0 5px var(--foreground)" : "none",
                  }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor="ed-hook">
                Accroche ({lang.toUpperCase()})
              </label>
              <textarea
                id="ed-hook"
                rows={2}
                maxLength={80}
                className="field resize-none rounded-xl py-2 font-display text-[15px] font-extrabold uppercase leading-tight"
                placeholder={"Twice\nis too many"}
                value={t.hook}
                onChange={(e) => updText({ hook: e.target.value })}
              />
              <span className="text-xs text-muted-foreground">Le texte en grand sur la couverture. Retour à la ligne autorisé.</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-ghost min-h-10 flex-1 text-sm"
                disabled={uploading}
                onClick={() => coverInput.current?.click()}
              >
                <ImageUp size={16} aria-hidden />
                {uploading ? "Envoi…" : d.coverUrl ? "Changer l'image" : "Importer une image"}
              </button>
              {d.coverUrl && (
                <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={() => upd({ coverUrl: null })}>
                  Retirer
                </button>
              )}
            </div>
            <input
              ref={coverInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => upload(e, (url) => upd({ coverUrl: url }))}
            />
          </section>

          <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
            <h2 className="m-0 text-base font-bold">URL &amp; référencement</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor="ed-slug">
                Adresse
              </label>
              <div className="flex items-center overflow-hidden rounded-xl border border-ink/18 bg-background focus-within:border-ink">
                <span className="pl-3 pr-1 font-mono text-[13px] text-muted-foreground">/blog/</span>
                <input
                  id="ed-slug"
                  className="min-h-[42px] min-w-0 flex-1 border-0 bg-transparent font-mono text-[13px] outline-none"
                  placeholder={slugHint}
                  value={d.slug}
                  onChange={(e) => upd({ slug: e.target.value })}
                  onBlur={(e) => e.target.value && upd({ slug: slugify(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor="ed-seo">
                Description ({lang.toUpperCase()}, moteurs de recherche)
              </label>
              <textarea
                id="ed-seo"
                rows={3}
                className="field resize-y rounded-xl py-2 text-[15px] leading-normal"
                placeholder="Reprend le chapeau si vide."
                value={t.seoDescription}
                onChange={(e) => updText({ seoDescription: e.target.value })}
              />
              <span className={cn("text-xs", t.seoDescription.length > 160 ? "font-semibold text-danger" : "text-muted-foreground")}>
                {t.seoDescription.length} / 160 caractères
              </span>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
