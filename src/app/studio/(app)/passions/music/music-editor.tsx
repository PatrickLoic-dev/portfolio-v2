"use client";

import { Wand2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { EASE } from "@/components/motion/ease";
import { fmtDayShort } from "@/components/studio/status";
import { useToast } from "@/components/studio/toast";
import { cn } from "@/lib/cn";
import { MOOD_KEYS, MOODS, type Mood } from "@/lib/moods";
import { fillFromLink, publishSong, saveMusicProfiles, type SongInput } from "../../../portfolio-actions";

type HistoryItem = SongInput & { id: string; createdAt: string };

const field = "field min-h-11 rounded-xl py-2 text-[15px]";

function providerName(link: string) {
  if (/music\.apple\.com|itunes\.apple\.com/.test(link)) return "Apple Music";
  if (/spotify\.com/.test(link)) return "Spotify";
  return null;
}

export function MusicEditor({
  initial,
  history,
  profiles,
}: {
  initial: SongInput;
  history: HistoryItem[];
  profiles: { spotifyProfile: string; appleProfile: string };
}) {
  const toast = useToast();
  const [d, setD] = useState(initial);
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [prof, setProf] = useState(profiles);
  const [filling, startFill] = useTransition();
  const [publishing, startPublish] = useTransition();
  const [savingProfiles, startProfiles] = useTransition();
  const set = (patch: Partial<SongInput>) => setD((x) => ({ ...x, ...patch }));
  const mood = MOODS[d.mood as Mood] ?? MOODS.focused;
  const provider = providerName(d.link);
  const note = lang === "fr" ? d.noteFr : d.noteEn;
  const moodText = lang === "fr" ? d.moodTextFr : d.moodTextEn;

  const fill = () =>
    startFill(async () => {
      const res = await fillFromLink(d.link);
      if (!res.ok) return toast(res.error, { tone: "error" });
      const info = res.data!;
      set({
        title: info.title || d.title,
        artist: info.artist || d.artist,
        album: info.album || d.album,
        artworkUrl: info.artworkUrl ?? d.artworkUrl,
      });
      toast(info.provider === "spotify" && !info.artist ? "Titre et pochette récupérés — complétez l'artiste" : "Infos récupérées");
    });

  const publish = () =>
    startPublish(async () => {
      const res = await publishSong(d);
      if (!res.ok) return toast(res.error, { tone: "error" });
      toast("Page Passions mise à jour");
    });

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px]">
        {/* Song */}
        <section className="hairline flex flex-col gap-4 rounded-[20px] border bg-card p-[22px]">
          <h2 className="m-0 text-base font-bold">1. Le morceau du moment</h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" htmlFor="sl">
              Lien Apple Music ou Spotify
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="sl"
                type="url"
                className={cn(field, "min-w-0 flex-[1_1_280px]")}
                placeholder="https://music.apple.com/… ou https://open.spotify.com/track/…"
                value={d.link}
                onChange={(e) => set({ link: e.target.value })}
              />
              <button type="button" className="btn btn-ghost min-h-11 text-sm disabled:opacity-60" disabled={filling || !d.link.trim()} onClick={fill}>
                <Wand2 size={16} aria-hidden />
                {filling ? "Lecture…" : "Remplir depuis le lien"}
              </button>
            </div>
            <span className="text-xs text-muted-foreground">
              Apple Music : titre, artiste, album et pochette se remplissent tout seuls. Spotify : titre et pochette.
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            {(
              [
                ["title", "Titre"],
                ["artist", "Artiste"],
                ["album", "Album"],
              ] as const
            ).map(([k, label]) => (
              <div key={k} className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold" htmlFor={`s-${k}`}>
                  {label}
                </label>
                <input id={`s-${k}`} className={field} value={d[k]} onChange={(e) => set({ [k]: e.target.value })} />
              </div>
            ))}
          </div>

          <div role="tablist" aria-label="Langue" className="flex gap-1">
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                role="tab"
                type="button"
                aria-selected={lang === l}
                onClick={() => setLang(l)}
                className={cn(
                  "min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
                  lang === l ? "bg-ink text-card" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {l === "fr" ? "Français" : "English"}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" htmlFor="sn">
              Pourquoi ce morceau maintenant ? ({lang.toUpperCase()})
            </label>
            <textarea
              id="sn"
              maxLength={140}
              rows={2}
              lang={lang}
              className="field resize-none rounded-xl py-2.5 text-[15px] leading-relaxed"
              placeholder="Une phrase, affichée sous le titre."
              value={note}
              onChange={(e) => set(lang === "fr" ? { noteFr: e.target.value } : { noteEn: e.target.value })}
            />
            <span className="text-xs text-muted-foreground">{note.length} / 140</span>
          </div>
        </section>

        {/* Mood */}
        <section className="hairline flex flex-col gap-4 rounded-[20px] border bg-card p-[22px]">
          <h2 className="m-0 text-base font-bold">2. L&apos;humeur</h2>
          <div role="radiogroup" aria-label="Humeur" className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
            {MOOD_KEYS.map((k) => {
              const m = MOODS[k];
              const on = d.mood === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set({ mood: k })}
                  className={cn(
                    "relative flex min-h-[76px] flex-col items-start justify-between gap-1 rounded-2xl border p-3.5 text-left transition-colors",
                    on ? "border-ink" : "border-ink/12 hover:border-ink/40",
                  )}
                  style={{ background: m.bg }}
                >
                  <span className="display text-xl">{m.label.fr}</span>
                  <span className="text-xs text-ink/70">{m.hint}</span>
                  {on && <motion.span layoutId="mood-ring" className="pointer-events-none absolute inset-[-3px] rounded-[18px] border-2 border-ink" />}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" htmlFor="mt">
              Phrase d&apos;humeur ({lang.toUpperCase()})
            </label>
            <input
              id="mt"
              lang={lang}
              className={field}
              value={moodText}
              onChange={(e) => set(lang === "fr" ? { moodTextFr: e.target.value } : { moodTextEn: e.target.value })}
            />
          </div>
        </section>

        {/* Profiles */}
        <section className="hairline flex flex-col gap-4 rounded-[20px] border bg-card p-[22px]">
          <h2 className="m-0 text-base font-bold">Profils</h2>
          <p className="m-0 text-[13px] text-muted-foreground">Utilisés pour les boutons « Me suivre sur … » de la page Passions. Laissez vide pour masquer.</p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor="pa">Profil Apple Music</label>
              <input id="pa" type="url" className={field} placeholder="https://music.apple.com/profile/…" value={prof.appleProfile} onChange={(e) => setProf({ ...prof, appleProfile: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor="sp">Profil Spotify</label>
              <input id="sp" type="url" className={field} placeholder="https://open.spotify.com/user/…" value={prof.spotifyProfile} onChange={(e) => setProf({ ...prof, spotifyProfile: e.target.value })} />
            </div>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-ghost min-h-10 text-sm"
              disabled={savingProfiles}
              onClick={() =>
                startProfiles(async () => {
                  const res = await saveMusicProfiles(prof);
                  toast(res.ok ? "Profils enregistrés" : res.error, { tone: res.ok ? "ok" : "error" });
                })
              }
            >
              Enregistrer les profils
            </button>
          </div>
        </section>
      </div>

      {/* Preview + history */}
      <aside className="flex flex-[1_1_320px] flex-col gap-4">
        <section className="flex flex-col gap-3.5 rounded-[20px] bg-ink p-[22px] text-background" aria-label="Aperçu sur le site">
          <span className="label text-background/60">Aperçu sur le site ({lang.toUpperCase()})</span>
          <div className="relative flex aspect-square items-end justify-center overflow-hidden rounded-2xl bg-blob-a">
            {d.artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.artworkUrl} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <span className="label mb-4 text-ink">Pochette</span>
            )}
          </div>
          <span className="label text-blob-b">{lang === "fr" ? "Le morceau du moment" : "Song of the moment"}</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={d.title + d.artist}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="flex flex-col gap-1"
            >
              <span className="font-display text-[28px] font-extrabold leading-none tracking-[-0.03em]">{d.title || "Titre du morceau"}</span>
              <span className="text-background/70">{[d.artist, d.album].filter(Boolean).join(" · ") || "Artiste · Album"}</span>
            </motion.div>
          </AnimatePresence>
          {note && <span className="text-sm text-background/85">“{note}”</span>}
          {provider && <span className="label text-background/60">{lang === "fr" ? "Écouter sur" : "Play on"} {provider} ↗</span>}
          <div className="flex flex-col gap-2 rounded-2xl p-4 text-ink" style={{ background: mood.bg }}>
            <span className="label">{lang === "fr" ? "Humeur du moment" : "Mood right now"}</span>
            <span className="display text-[32px]">{mood.label[lang]}</span>
            {moodText && <span className="text-sm">{moodText}</span>}
          </div>
        </section>
        <button type="button" className="btn btn-primary min-h-12 disabled:opacity-60" disabled={publishing} onClick={publish}>
          {publishing ? "Mise à jour…" : "Mettre à jour le site"}
        </button>

        <section className="hairline flex flex-col gap-1 rounded-[20px] border bg-card p-[22px]">
          <h2 className="m-0 mb-2 text-base font-bold">Historique</h2>
          {history.length === 0 && <span className="text-sm text-muted-foreground">Les morceaux précédents apparaîtront ici.</span>}
          {history.map((h) => (
            <div key={h.id} className="hairline flex items-center justify-between gap-3 border-t py-2.5">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">{h.title}</span>
                <span className="text-xs text-muted-foreground">
                  {(MOODS[h.mood as Mood] ?? MOODS.focused).label.fr} · {fmtDayShort(h.createdAt)}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost min-h-9 px-3.5 text-xs"
                onClick={() => {
                  const { id, createdAt, ...song } = h;
                  void id;
                  void createdAt;
                  setD(song);
                  toast("Morceau rechargé — cliquez sur « Mettre à jour le site »");
                }}
              >
                Remettre
              </button>
            </div>
          ))}
        </section>
      </aside>
    </div>
  );
}
