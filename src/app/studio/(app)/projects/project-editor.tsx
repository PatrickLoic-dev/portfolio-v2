"use client";

import { ArrowLeft, ArrowRight, ImageUp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";
import { EASE } from "@/components/motion/ease";
import { ProjectMedia } from "@/components/project/project-media";
import { StudioTopBar } from "@/components/studio/page-header";
import { Switch } from "@/components/studio/switch";
import { useToast } from "@/components/studio/toast";
import { cn } from "@/lib/cn";
import { slugify } from "@/lib/slug";
import { tones, type Tone } from "@/lib/tones";
import { uploadImage } from "../../actions";
import { saveProject, type ProjectInput } from "../../portfolio-actions";
import { StackInput } from "./stack-input";

type Lang = "fr" | "en";
type Text = ProjectInput["translations"]["fr"];
export type EditorProject = ProjectInput & { updatedAt: string | null };

const COVERS: [Tone, string][] = [
  ["peach", "Pêche"],
  ["leaf", "Feuille"],
  ["sand", "Sable"],
  ["sage", "Sauge"],
  ["terracotta", "Terracotta"],
  ["muted", "Lin"],
  ["ink", "Encre"],
];

const SECTIONS = [
  { key: "problem", label: "01 · Le problème" },
  { key: "approach", label: "02 · L'approche" },
  { key: "outcome", label: "03 · Le résultat" },
] as const;

const field = "field min-h-11 rounded-xl py-2 text-[15px]";
const area = "field min-h-[110px] resize-y rounded-xl py-2.5 text-[15px] leading-relaxed";

export function ProjectEditor({ initial, usedTags }: { initial: EditorProject; usedTags: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [p, setP] = useState(initial);
  const [lang, setLang] = useState<Lang>("fr");
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [uploading, startUpload] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const isNew = p.id === null;
  const personal = p.type === "personal";
  const t = p.translations[lang];

  const upd = (patch: Partial<EditorProject>) => {
    setP((x) => ({ ...x, ...patch }));
    setDirty(true);
  };
  const updText = (patch: Partial<Text>) => {
    setP((x) => ({ ...x, translations: { ...x.translations, [lang]: { ...x.translations[lang], ...patch } } }));
    setDirty(true);
  };

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  function save() {
    setError(null);
    startSave(async () => {
      const { updatedAt, ...input } = p;
      void updatedAt;
      const res = await saveProject(input);
      if (!res.ok) {
        setError(res.error);
        toast(res.error, { tone: "error" });
        return;
      }
      setP((x) => ({ ...x, id: res.data!.id, slug: res.data!.slug }));
      setDirty(false);
      setSavedAt(new Date().toISOString());
      toast(p.status === "published" ? "Projet enregistré et publié" : "Brouillon enregistré");
      if (isNew) router.replace(`/studio/projects/${res.data!.id}`);
      else router.refresh();
    });
  }

  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    if (!files.length) return;
    startUpload(async () => {
      const urls: string[] = [];
      for (const file of files) {
        const form = new FormData();
        form.set("file", file);
        const res = await uploadImage(form);
        if (res.ok) urls.push(res.data!.url);
        else toast(res.error, { tone: "error" });
      }
      if (urls.length) {
        setP((x) => ({ ...x, media: [...x.media, ...urls].slice(0, 12) }));
        setDirty(true);
      }
    });
  }

  const moveMedia = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= p.media.length) return;
    const m = [...p.media];
    [m[i], m[j]] = [m[j], m[i]];
    upd({ media: m });
  };

  const setMetric = (i: number, patch: Partial<ProjectInput["metrics"][number]>) => {
    const m = [...p.metrics];
    while (m.length < 3) m.push({ value: "", labelEn: "", labelFr: "" });
    m[i] = { ...m[i], ...patch };
    upd({ metrics: m });
  };
  const metrics = [0, 1, 2].map((i) => p.metrics[i] ?? { value: "", labelEn: "", labelFr: "" });

  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Projets", href: "/studio/projects" }, { label: p.name || "Nouveau projet" }]}>
        <span role="status" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
          <span className={cn("size-2 rounded-full", dirty ? "bg-accent" : "bg-success")} />
          {saving
            ? "Enregistrement…"
            : dirty
              ? "Modifications non enregistrées"
              : savedAt
                ? `Enregistré · ${new Date(savedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                : "Nouveau projet (non enregistré)"}
        </span>
      </StudioTopBar>

      <div className="flex flex-wrap items-start gap-5 p-[clamp(24px,3vw,40px)]">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px]">
          <div className="flex flex-col gap-3">
            <span className="label text-accent-ink">Projets · {isNew ? "Nouveau" : "Éditer"}</span>
            <h1 className="display text-[clamp(40px,4.5vw,64px)]">
              {p.name || "Nouveau projet"}
              <span className="text-accent">.</span>
            </h1>
          </div>

          {/* Informations */}
          <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
            <h2 className="m-0 text-base font-bold">Informations</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold" htmlFor="pn">Nom du projet</label>
                <input id="pn" className={field} value={p.name} onChange={(e) => upd({ name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold" htmlFor="pt">Type</label>
                <select id="pt" className={field} value={p.type} onChange={(e) => upd({ type: e.target.value as ProjectInput["type"] })}>
                  <option value="professional">Professionnel</option>
                  <option value="community">Communauté</option>
                  <option value="personal">Projet perso</option>
                </select>
              </div>
              {!personal && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold" htmlFor="pc">Client</label>
                  <input id="pc" className={field} value={p.client} onChange={(e) => upd({ client: e.target.value })} />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold" htmlFor="pp">Plateforme</label>
                <select id="pp" className={field} value={p.platform} onChange={(e) => upd({ platform: e.target.value as ProjectInput["platform"] })}>
                  <option value="web">Web responsive</option>
                  <option value="mobile">App mobile</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold" htmlFor="pr">Votre rôle</label>
                <input id="pr" className={field} placeholder="Ex. : Lead frontend" value={p.role} onChange={(e) => upd({ role: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold" htmlFor="pl">Lien du projet en ligne</label>
                <input id="pl" type="url" className={field} placeholder="https://…" value={p.liveUrl} onChange={(e) => upd({ liveUrl: e.target.value })} />
              </div>
            </div>
            <StackInput value={p.tags} used={usedTags} onChange={(tags) => upd({ tags })} />
          </section>

          {/* Personal projects: source code */}
          <AnimatePresence initial={false}>
            {personal && (
              <motion.section
                key="source"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="hairline overflow-hidden rounded-[20px] border bg-card"
              >
                <div className="flex flex-col gap-3.5 p-[22px]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <h2 className="m-0 text-base font-bold">Code source</h2>
                      <span className="text-[13px] text-muted-foreground">
                        Classe le projet dans « Open source » ou « Code privé » sur la page Projets.
                      </span>
                    </div>
                    <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
                      Open source
                      <Switch checked={p.openSource} label="Projet open source" onChange={(openSource) => upd({ openSource })} />
                    </label>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold" htmlFor="prepo">
                      Lien du dépôt{" "}
                      <span className="font-normal text-muted-foreground">
                        {p.openSource ? "(GitHub, GitLab…)" : "(facultatif, affiché seulement si le projet est open source)"}
                      </span>
                    </label>
                    <input
                      id="prepo"
                      type="url"
                      className={field}
                      placeholder="https://github.com/…"
                      value={p.repoUrl}
                      onChange={(e) => upd({ repoUrl: e.target.value })}
                    />
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Bilingual text */}
          <section className="hairline overflow-hidden rounded-[20px] border bg-card">
            <div role="tablist" aria-label="Langue" className="hairline flex items-center gap-1 border-b px-[22px] pt-3">
              {(["fr", "en"] as const).map((l) => {
                const filled = !!(p.translations[l].description.trim() || p.translations[l].problem.trim());
                return (
                  <button
                    key={l}
                    role="tab"
                    type="button"
                    aria-selected={lang === l}
                    onClick={() => setLang(l)}
                    className={cn(
                      "-mb-px flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors",
                      lang === l ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {l === "fr" ? "Français" : "English"}
                    <span className={cn("size-1.5 rounded-full", filled ? "bg-success" : "bg-ink/20")} />
                  </button>
                );
              })}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={lang}
                lang={lang}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-4 p-[22px]"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_200px] gap-3.5 max-nav:grid-cols-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold" htmlFor="pd">
                      Description courte <span className="font-normal text-muted-foreground">(cartes Work et accueil)</span>
                    </label>
                    <textarea id="pd" className={cn(area, "min-h-20")} value={t.description} onChange={(e) => updText({ description: e.target.value })} />
                    <span className={cn("text-xs", t.description.length > 160 ? "font-semibold text-danger" : "text-muted-foreground")}>
                      {t.description.length} / 160 caractères
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold" htmlFor="psec">Secteur</label>
                    <input id="psec" className={field} placeholder="Fintech" value={t.sector} onChange={(e) => updText({ sector: e.target.value })} />
                  </div>
                </div>
                <h3 className="m-0 mt-2 text-base font-bold">Étude de cas</h3>
                {SECTIONS.map((s) => (
                  <div key={s.key} className="flex flex-col gap-1.5 rounded-2xl bg-surface/60 p-4">
                    <label className="text-[13px] font-semibold" htmlFor={`${s.key}-t`}>
                      {s.label}
                    </label>
                    <input
                      id={`${s.key}-t`}
                      className={cn(field, "bg-card font-semibold")}
                      placeholder="Titre (facultatif) : une phrase forte"
                      value={t[`${s.key}Title`]}
                      onChange={(e) => updText({ [`${s.key}Title`]: e.target.value } as Partial<Text>)}
                    />
                    <label className="sr-only" htmlFor={`${s.key}-b`}>
                      {s.label} · texte
                    </label>
                    <textarea
                      id={`${s.key}-b`}
                      className={cn(area, "bg-card")}
                      value={t[s.key]}
                      onChange={(e) => updText({ [s.key]: e.target.value } as Partial<Text>)}
                    />
                  </div>
                ))}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
                  {metrics.map((m, i) => (
                    <div key={i} className="flex flex-col gap-1.5 rounded-xl bg-surface p-3">
                      <label className="sr-only" htmlFor={`mv${i}`}>Chiffre {i + 1}</label>
                      <input
                        id={`mv${i}`}
                        className={cn(field, "bg-card font-bold")}
                        placeholder={["-40 %", "12k", "Live"][i]}
                        value={m.value}
                        onChange={(e) => setMetric(i, { value: e.target.value })}
                      />
                      <label className="sr-only" htmlFor={`ml${i}`}>Libellé {i + 1} ({lang.toUpperCase()})</label>
                      <input
                        id={`ml${i}`}
                        className="field min-h-9 rounded-xl bg-card py-1.5 text-[13px]"
                        placeholder={`Libellé (${lang.toUpperCase()})`}
                        value={lang === "fr" ? m.labelFr : m.labelEn}
                        onChange={(e) => setMetric(i, lang === "fr" ? { labelFr: e.target.value } : { labelEn: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Les chiffres s&apos;affichent sous « Le résultat » ; laissez vide pour les masquer.</span>
              </motion.div>
            </AnimatePresence>
          </section>

          {/* Media */}
          <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 text-base font-bold">Médias</h2>
              <span className="text-xs text-muted-foreground">La première capture remplace le cadre stylisé.</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <AnimatePresence initial={false}>
                {p.media.map((src, i) => (
                  <motion.figure
                    key={src}
                    layout
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="group relative m-0 h-[90px] w-[120px] overflow-hidden rounded-xl border border-ink/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Capture ${i + 1}`} className="size-full object-cover" />
                    {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-card">Couverture</span>}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 p-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                      <button type="button" className="inline-flex size-7 items-center justify-center rounded text-card disabled:opacity-30" aria-label="Déplacer à gauche" disabled={i === 0} onClick={() => moveMedia(i, -1)}>
                        <ArrowLeft size={14} aria-hidden />
                      </button>
                      <button type="button" className="inline-flex size-7 items-center justify-center rounded text-card" aria-label={`Retirer la capture ${i + 1}`} onClick={() => upd({ media: p.media.filter((x) => x !== src) })}>
                        <X size={14} aria-hidden />
                      </button>
                      <button type="button" className="inline-flex size-7 items-center justify-center rounded text-card disabled:opacity-30" aria-label="Déplacer à droite" disabled={i === p.media.length - 1} onClick={() => moveMedia(i, 1)}>
                        <ArrowRight size={14} aria-hidden />
                      </button>
                    </div>
                  </motion.figure>
                ))}
              </AnimatePresence>
              <button
                type="button"
                className="btn btn-ghost h-[90px] border-dashed text-sm disabled:opacity-60"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                <ImageUp size={16} aria-hidden />
                {uploading ? "Envoi…" : "Ajouter une capture"}
              </button>
              <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={onUpload} />
            </div>
          </section>
        </div>

        {/* Side panel */}
        <aside className="flex flex-[1_1_320px] flex-col gap-4">
          <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
            <h2 className="m-0 text-base font-bold">Publication</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor="ps">Statut</label>
              <select id="ps" className={field} value={p.status} onChange={(e) => upd({ status: e.target.value as ProjectInput["status"] })}>
                <option value="published">Publié</option>
                <option value="draft">Brouillon</option>
              </select>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
              <input type="checkbox" className="size-[18px] accent-ink" checked={p.featured} onChange={(e) => upd({ featured: e.target.checked })} />
              Mettre à la une sur l&apos;accueil
            </label>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor="pslug">Adresse</label>
              <div className="flex items-center overflow-hidden rounded-xl border border-ink/18 bg-background focus-within:border-ink">
                <span className="pl-3 pr-1 font-mono text-[13px] text-muted-foreground">/work/</span>
                <input
                  id="pslug"
                  className="min-h-[42px] min-w-0 flex-1 border-0 bg-transparent font-mono text-[13px] outline-none"
                  placeholder={slugify(p.name) || "mon-projet"}
                  value={p.slug}
                  onChange={(e) => upd({ slug: e.target.value })}
                  onBlur={(e) => e.target.value && upd({ slug: slugify(e.target.value) })}
                />
              </div>
            </div>
            {error && (
              <p role="alert" className="m-0 rounded-xl bg-danger/10 px-3.5 py-2.5 text-[13px] font-medium text-danger">
                {error}
              </p>
            )}
            <button type="button" className="btn btn-primary min-h-11 text-sm disabled:opacity-60" disabled={saving} onClick={save}>
              Enregistrer
            </button>
            {!isNew && p.status === "published" && (
              <a href={`/work/${p.slug}`} target="_blank" className="btn btn-ghost min-h-11 text-sm">
                Voir l&apos;étude de cas ↗
              </a>
            )}
            {isNew && (
              <Link href="/studio/projects" className="text-center text-[13px] text-muted-foreground underline underline-offset-[3px]">
                Annuler
              </Link>
            )}
          </section>

          <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
            <h2 className="m-0 text-base font-bold">Couverture</h2>
            <div role="radiogroup" aria-label="Couleur de couverture" className="flex flex-wrap gap-2">
              {COVERS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={p.tone === key}
                  aria-label={label}
                  title={label}
                  onClick={() => upd({ tone: key })}
                  className="size-10 rounded-full border border-ink/14"
                  style={{ background: tones[key].bg, boxShadow: p.tone === key ? "0 0 0 3px var(--card), 0 0 0 5px var(--foreground)" : "none" }}
                />
              ))}
            </div>
            <span className="label text-muted-foreground">Aperçu de la carte</span>
            <div className="hairline overflow-hidden rounded-2xl border">
              <ProjectMedia
                project={{ name: p.name || "Projet", tone: p.tone as Tone, mobile: p.platform === "mobile", host: "", media: p.media }}
                size="card"
                className="aspect-[5/4]"
              />
              <div className="flex flex-col gap-2 bg-card p-3.5">
                <span className="font-bold">{p.name || "Nom du projet"}</span>
                <span className="text-[13px] leading-snug text-muted-foreground">{t.description || "Description courte…"}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
