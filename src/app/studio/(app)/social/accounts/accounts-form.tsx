"use client";

import { Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { NetBadge } from "@/components/studio/net-badge";
import { useToast } from "@/components/studio/toast";
import { DAY_SHORT, NETWORK_KEYS, NETWORKS, type SocialNetwork, type SocialSettings } from "@/lib/social";
import { saveSocialSettings } from "../../../social-actions";

const field = "field min-h-11 rounded-xl py-2 text-[15px]";
const PLACEHOLDER: Record<SocialNetwork, { handle: string; url: string }> = {
  linkedin: { handle: "Patrick Loic", url: "https://www.linkedin.com/in/…" },
  instagram: { handle: "@patrickloic", url: "https://www.instagram.com/…" },
  x: { handle: "@patrickloic", url: "https://x.com/…" },
};

export function AccountsForm({ initial }: { initial: SocialSettings }) {
  const toast = useToast();
  const [s, setS] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();

  const setAccount = (n: SocialNetwork, patch: Partial<SocialSettings["accounts"][SocialNetwork]>) => {
    setS((x) => ({ ...x, accounts: { ...x.accounts, [n]: { ...x.accounts[n], ...patch } } }));
    setDirty(true);
  };
  const setSlots = (n: SocialNetwork, slots: SocialSettings["slots"][SocialNetwork]) => {
    setS((x) => ({ ...x, slots: { ...x.slots, [n]: slots } }));
    setDirty(true);
  };

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        {NETWORK_KEYS.map((n) => (
          <section key={n} className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-[22px]">
            <div className="flex items-center gap-3">
              <NetBadge network={n} size={36} className="rounded-lg" />
              <div className="flex flex-col">
                <span className="font-bold">{NETWORKS[n].name}</span>
                <span className="text-xs text-muted-foreground">Publication assistée (API à venir)</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor={`h-${n}`}>Nom affiché / pseudo</label>
              <input id={`h-${n}`} className={field} placeholder={PLACEHOLDER[n].handle} value={s.accounts[n].handle} onChange={(e) => setAccount(n, { handle: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor={`u-${n}`}>URL du profil</label>
              <input id={`u-${n}`} type="url" className={field} placeholder={PLACEHOLDER[n].url} value={s.accounts[n].url} onChange={(e) => setAccount(n, { url: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold">Créneaux conseillés (heure de Douala)</span>
              <AnimatePresence initial={false}>
                {s.slots[n].map((slot, i) => (
                  <motion.div key={`${i}-${slot.day}-${slot.time}`} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`d-${n}-${i}`}>Jour</label>
                    <select
                      id={`d-${n}-${i}`}
                      className="field min-h-10 w-auto rounded-xl py-1.5 text-sm"
                      value={slot.day}
                      onChange={(e) => setSlots(n, s.slots[n].map((x, k) => (k === i ? { ...x, day: Number(e.target.value) } : x)))}
                    >
                      {DAY_SHORT.slice(1).map((d, k) => (
                        <option key={d} value={k + 1}>{d}</option>
                      ))}
                    </select>
                    <label className="sr-only" htmlFor={`t-${n}-${i}`}>Heure</label>
                    <input
                      id={`t-${n}-${i}`}
                      type="time"
                      className="field min-h-10 w-auto rounded-xl py-1.5 text-sm"
                      value={slot.time}
                      onChange={(e) => setSlots(n, s.slots[n].map((x, k) => (k === i ? { ...x, time: e.target.value } : x)))}
                    />
                    <button type="button" className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Retirer ce créneau" onClick={() => setSlots(n, s.slots[n].filter((_, k) => k !== i))}>
                      <X size={15} aria-hidden />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <button type="button" className="btn btn-ghost min-h-9 self-start px-3 text-xs" onClick={() => setSlots(n, [...s.slots[n], { day: 2, time: "09:00" }])}>
                <Plus size={14} aria-hidden /> Ajouter un créneau
              </button>
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-primary min-h-11 text-sm disabled:opacity-60"
          disabled={pending || !dirty}
          onClick={() =>
            start(async () => {
              const res = await saveSocialSettings(s);
              if (!res.ok) return toast(res.error, { tone: "error" });
              setDirty(false);
              toast("Comptes et créneaux enregistrés");
            })
          }
        >
          Enregistrer
        </button>
        {dirty && <span className="text-[13px] text-muted-foreground">Modifications non enregistrées</span>}
      </div>

      <section className="hairline overflow-hidden rounded-[20px] border bg-card">
        <div className="flex flex-col gap-1 px-6 py-5">
          <h2 className="m-0 text-lg font-bold">Règles de publication appliquées</h2>
          <span className="text-[13px] text-muted-foreground">Utilisées par le Composer pour bloquer ou avertir · à vérifier régulièrement, les plateformes les modifient.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="label bg-surface text-[11px] text-muted-foreground">
                <th className="px-6 py-3 font-medium">Réseau</th>
                <th className="px-3 py-3 font-medium">Texte max.</th>
                <th className="px-3 py-3 font-medium">Médias</th>
                <th className="px-3 py-3 font-medium">Hashtags</th>
                <th className="px-6 py-3 font-medium">À savoir</th>
              </tr>
            </thead>
            <tbody>
              {NETWORK_KEYS.map((n) => (
                <tr key={n} className="hairline border-t">
                  <td className="px-6 py-3.5">
                    <span className="flex items-center gap-2 font-semibold">
                      <NetBadge network={n} size={22} /> {NETWORKS[n].name}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-mono text-xs">{NETWORKS[n].limit.toLocaleString("fr-FR")} car.</td>
                  <td className="px-3 py-3.5">{NETWORKS[n].rule.media}</td>
                  <td className="px-3 py-3.5">{NETWORKS[n].rule.tags}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{NETWORKS[n].rule.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
