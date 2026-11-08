"use client";

import { Plus, RefreshCw, X } from "lucide-react";
import { motion } from "motion/react";
import { useOptimistic, useState, useTransition, type FormEvent } from "react";
import { EASE } from "@/components/motion/ease";
import { fmtDayTime } from "@/components/studio/status";
import { Switch } from "@/components/studio/switch";
import { useToast } from "@/components/studio/toast";
import { cn } from "@/lib/cn";
import { SteamImage } from "@/components/passions/steam-image";
import { steamArt } from "@/lib/steam-art";
import { toneOf } from "@/lib/tones";
import { addFamilyGameNow, removeFamilyGame, saveSteamOptions, setFamilyGameHours, setGameFlags, setMinPct, syncSteamNow } from "../../../portfolio-actions";

type Row = {
  id: string;
  name: string;
  pct: number | null;
  hours: number;
  daysAgo: number | null;
  tone: string;
  appId: number | null;
  family: boolean;
  visible: boolean;
  pinned: boolean;
};

/** Steam Family Sharing games don't come back from the API: add them from their Store link. */
function FamilyForm({ disabled }: { disabled: boolean }) {
  const toast = useToast();
  const [link, setLink] = useState("");
  const [hours, setHours] = useState("");
  const [pending, start] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await addFamilyGameNow(link, Number(hours) || 0);
      if (!res.ok) return toast(res.error, { tone: "error" });
      toast(res.data!.withAchievements ? `${res.data!.name} ajouté avec ses succès` : `${res.data!.name} ajouté (pas de succès lisibles)`);
      setLink("");
      setHours("");
    });
  };

  return (
    <form onSubmit={submit} className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-base font-bold">Jeux de la famille Steam</h2>
        <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
          Steam ne renvoie pas les jeux prêtés par le partage familial. Collez leur lien du Store : nom, jaquette et succès se remplissent,
          les heures se saisissent ici.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1.5">
          <label className="text-[13px] font-semibold" htmlFor="fam-link">
            Lien Steam Store
          </label>
          <input
            id="fam-link"
            className="field min-h-11 rounded-xl py-2 text-[15px]"
            placeholder="https://store.steampowered.com/app/…"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="flex w-[120px] flex-col gap-1.5">
          <label className="text-[13px] font-semibold" htmlFor="fam-hours">
            Heures jouées
          </label>
          <input
            id="fam-hours"
            type="number"
            min={0}
            className="field min-h-11 rounded-xl py-2 text-[15px]"
            placeholder="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            disabled={disabled}
          />
        </div>
        <button type="submit" className="btn btn-primary min-h-11 text-sm disabled:opacity-60" disabled={disabled || pending || !link.trim()}>
          <Plus size={16} aria-hidden />
          {pending ? "Ajout…" : "Ajouter"}
        </button>
      </div>
      {disabled && <span className="text-xs text-muted-foreground">Synchronisez d&apos;abord votre compte Steam.</span>}
    </form>
  );
}

const last = (d: number | null) =>
  d === null ? "—" : d === 0 ? "aujourd'hui" : d === 1 ? "hier" : d < 30 ? `il y a ${d} j` : `il y a ${Math.round(d / 30)} mois`;

const grid = "grid grid-cols-[minmax(0,1fr)_110px_52px] items-center gap-4 nav:grid-cols-[86px_minmax(0,2fr)_minmax(0,1.4fr)_80px_120px_80px]";

export function GamesManager({
  configured,
  steam,
  minPct,
  sample,
  games,
}: {
  configured: boolean;
  steam: { steamId: string; lastSyncAt: string | null; autoSync: boolean };
  minPct: number;
  sample: boolean;
  games: Row[];
}) {
  const toast = useToast();
  const [steamId, setSteamId] = useState(steam.steamId);
  const [autoSync, setAutoSync] = useState(steam.autoSync);
  const [syncing, startSync] = useTransition();
  const [pending, start] = useTransition();
  const [list, update] = useOptimistic(games, (rows: Row[], patch: { id: string } & Partial<Row>) =>
    rows.map((r) => (r.id === patch.id ? { ...r, ...patch } : patch.pinned ? { ...r, pinned: false } : r)),
  );
  const [threshold, setThreshold] = useOptimistic(minPct);
  const linked = !!steam.steamId;

  const sync = () =>
    startSync(async () => {
      const res = await syncSteamNow(steamId);
      if (!res.ok) return toast(res.error, { tone: "error" });
      toast(`Steam synchronisé — ${res.data!.count} jeux`);
    });

  const sorted = [...list].sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || b.hours - a.hours);

  return (
    <>
      {sample && (
        <div role="note" className="rounded-2xl border border-dashed border-accent/50 bg-blob-c/40 px-5 py-3.5 text-sm font-medium">
          Données d&apos;exemple — elles seront remplacées par vos vrais jeux et succès après la première synchronisation Steam.
        </div>
      )}

      <section className="hairline flex flex-col gap-4 rounded-[20px] border bg-card p-[22px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#1b2838] text-[10px] font-extrabold text-white" aria-hidden>
              STEAM
            </span>
            <div className="flex flex-col">
              <span className="font-bold">Steam</span>
              <span className="text-[13px] text-muted-foreground">
                {steam.lastSyncAt ? `Synchronisé le ${fmtDayTime(steam.lastSyncAt)}` : "Jamais synchronisé"}
              </span>
            </div>
          </div>
          <span
            className="inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold"
            style={{ background: linked ? "var(--blob-b)" : "var(--blob-c)" }}
          >
            {linked ? "Lié" : "À lier"}
          </span>
        </div>

        {!configured && (
          <p className="m-0 rounded-xl bg-danger/8 px-4 py-3 text-[13px] leading-relaxed">
            Ajoutez <code className="font-mono">STEAM_API_KEY</code> dans <code className="font-mono">.env.local</code> pour activer la
            synchronisation. La clé est gratuite :{" "}
            <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-[3px]">
              steamcommunity.com/dev/apikey
            </a>
            .
          </p>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
            <label className="text-[13px] font-semibold" htmlFor="steam-id">
              Identifiant Steam (SteamID, URL de profil ou URL personnalisée)
            </label>
            <input
              id="steam-id"
              className="field min-h-11 rounded-xl py-2 text-[15px]"
              placeholder="ex. patrickloic ou https://steamcommunity.com/id/patrickloic"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary min-h-11 text-sm disabled:opacity-60" disabled={!configured || syncing || !steamId.trim()} onClick={sync}>
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} aria-hidden />
            {syncing ? "Synchronisation…" : linked ? "Synchroniser maintenant" : "Lier et synchroniser"}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted-foreground">
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 font-medium text-foreground">
            <input
              type="checkbox"
              className="size-[18px] accent-ink"
              checked={autoSync}
              onChange={(e) => {
                setAutoSync(e.target.checked);
                start(async () => {
                  await saveSteamOptions({ autoSync: e.target.checked });
                });
              }}
            />
            Synchro automatique chaque nuit
          </label>
          <span>Le profil Steam et ses « Détails des jeux » doivent être publics.</span>
        </div>
      </section>

      <FamilyForm disabled={!configured || !linked} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="label text-muted-foreground">
          {list.length} jeux · les 40 plus joués{list.some((g) => g.family) ? " + famille" : ""}
        </span>
        <div className="flex items-center gap-2.5">
          <label className="text-[13px] font-semibold" htmlFor="minp">
            Masquer sous
          </label>
          <select
            id="minp"
            className="field min-h-11 w-auto rounded-full bg-card py-2 text-sm"
            value={threshold}
            onChange={(e) =>
              start(async () => {
                const v = Number(e.target.value);
                setThreshold(v);
                await setMinPct(v);
              })
            }
          >
            <option value={0}>0 %</option>
            <option value={25}>25 %</option>
            <option value={50}>50 %</option>
          </select>
        </div>
      </div>

      <div className={cn("hairline overflow-hidden rounded-[20px] border bg-card transition-opacity", pending && "opacity-80")}>
        <div className={cn(grid, "label bg-surface px-5 py-3.5 text-[11px] text-muted-foreground")}>
          <span className="hidden nav:block" />
          <span>Jeu</span>
          <span className="hidden nav:block">Progression</span>
          <span className="hidden nav:block">Heures</span>
          <span>Du moment</span>
          <span>Sur le site</span>
        </div>
        {sorted.map((g) => {
          const hidden = !g.visible || (g.pct ?? 0) < threshold;
          return (
            <motion.div
              key={g.id}
              layout
              transition={{ duration: 0.3, ease: EASE }}
              className={cn(grid, "hairline border-t px-5 py-3", hidden && "opacity-55")}
            >
              <span className="relative hidden h-10 w-[86px] overflow-hidden rounded-lg border border-ink/8 nav:block" style={{ background: toneOf(g.tone).bg }}>
                {steamArt(g.appId) && <SteamImage srcs={steamArt(g.appId)!.header} className="absolute inset-0 size-full object-cover" />}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[15px] font-semibold">{g.name}</span>
                  {g.family && (
                    <span className="flex-none rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold" title="Joué via le partage familial Steam">
                      Famille
                    </span>
                  )}
                </span>
                <span className="text-[13px] text-muted-foreground">{g.family ? "Ajouté depuis le Store" : `Joué ${last(g.daysAgo)}`}</span>
              </div>
              <div className="hidden items-center gap-3 nav:flex">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-2 rounded-full", g.pct === 100 ? "bg-success" : "bg-accent")} style={{ width: `${g.pct ?? 0}%` }} />
                </div>
                <b className="w-11 text-right text-sm">{g.pct === null ? "—" : `${g.pct} %`}</b>
              </div>
              {g.family ? (
                <span className="hidden items-center gap-1 nav:flex">
                  <label className="sr-only" htmlFor={`h-${g.id}`}>
                    Heures jouées — {g.name}
                  </label>
                  <input
                    id={`h-${g.id}`}
                    type="number"
                    min={0}
                    defaultValue={g.hours}
                    className="field h-8 min-h-0 w-14 rounded-lg px-1.5 py-0 text-center font-mono text-xs"
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v !== g.hours)
                        start(async () => {
                          update({ id: g.id, hours: v });
                          await setFamilyGameHours(g.id, v);
                          toast(`${g.name} : ${v} h`);
                        });
                    }}
                  />
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-danger hover:text-card"
                    aria-label={`Retirer ${g.name}`}
                    title="Retirer ce jeu"
                    onClick={() =>
                      start(async () => {
                        await removeFamilyGame(g.id);
                        toast(`${g.name} retiré`);
                      })
                    }
                  >
                    <X size={14} aria-hidden />
                  </button>
                </span>
              ) : (
                <span className="hidden font-mono text-xs text-muted-foreground nav:block">{g.hours} h</span>
              )}
              <button
                type="button"
                aria-pressed={g.pinned}
                className={cn(
                  "inline-flex min-h-9 items-center justify-center rounded-full border px-3 text-xs font-semibold transition-colors",
                  g.pinned ? "border-ink bg-ink text-card" : "border-ink/18 hover:border-ink",
                )}
                onClick={() =>
                  !g.pinned &&
                  start(async () => {
                    update({ id: g.id, pinned: true });
                    await setGameFlags(g.id, { pinned: true });
                    toast(`${g.name} affiché comme « Currently playing »`);
                  })
                }
              >
                {g.pinned ? "Du moment" : "Choisir"}
              </button>
              <Switch
                checked={g.visible}
                label={`Afficher ${g.name} sur le site`}
                onChange={(visible) =>
                  start(async () => {
                    update({ id: g.id, visible });
                    await setGameFlags(g.id, { visible });
                  })
                }
              />
            </motion.div>
          );
        })}
        {list.length === 0 && (
          <p className="hairline m-0 border-t px-6 py-12 text-center text-muted-foreground">Aucun jeu pour l&apos;instant — liez votre compte Steam.</p>
        )}
      </div>
    </>
  );
}
