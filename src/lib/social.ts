/**
 * Social planner rules (shared by the Studio UI and the server actions).
 * Limits follow each platform's rules — re-check them now and then, platforms change them.
 */
import type { SocialCustomText, SocialNetwork, SocialPublished } from "@/db/schema";

export type { SocialNetwork };

export const NETWORKS: Record<
  SocialNetwork,
  {
    name: string;
    mark: string;
    color: string;
    limit: number;
    maxImages: number;
    needsMedia?: boolean;
    maxHashtags?: number;
    /** How many characters a link costs (X shortens every URL to 23). */
    linkCost?: number;
    /** Characters shown before "…see more". */
    fold?: number;
    firstComment: boolean;
    rule: { media: string; tags: string; note: string };
  }
> = {
  linkedin: {
    name: "LinkedIn",
    mark: "in",
    color: "#0a66c2",
    limit: 3000,
    maxImages: 20,
    fold: 210,
    firstComment: true,
    rule: { media: "Jusqu'à 20 images, ou 1 vidéo, ou 1 PDF", tags: "Pas de limite stricte", note: "Le texte est coupé vers 210 caractères (« voir plus »)." },
  },
  x: {
    name: "X",
    mark: "X",
    color: "#0f1419",
    limit: 280,
    maxImages: 4,
    linkCost: 23,
    firstComment: false,
    rule: { media: "4 images ou 1 vidéo, jamais les deux", tags: "Comptent dans la limite", note: "Chaque lien compte pour 23 caractères." },
  },
  instagram: {
    name: "Instagram",
    mark: "IG",
    color: "#c13584",
    limit: 2200,
    maxImages: 10,
    needsMedia: true,
    maxHashtags: 5,
    firstComment: true,
    rule: { media: "Obligatoire · jusqu'à 10 en carrousel", tags: "5 maximum", note: "Les liens ne sont pas cliquables : bio ou premier commentaire." },
  },
};

export const NETWORK_KEYS = Object.keys(NETWORKS) as SocialNetwork[];

export type Draft = {
  networks: SocialNetwork[];
  text: string;
  custom: SocialCustomText;
  link: string;
  firstComment: string;
  media: string[];
};

export const textFor = (d: Pick<Draft, "text" | "custom">, n: SocialNetwork) => d.custom[n] ?? d.text;

/** The exact text to post on a network (link appended when not already in it — never on Instagram). */
export function finalText(d: Pick<Draft, "text" | "custom" | "link">, n: SocialNetwork) {
  const t = textFor(d, n).trim();
  if (!d.link || n === "instagram" || t.includes(d.link)) return t;
  return t ? `${t}\n\n${d.link}` : d.link;
}

export function charCount(d: Pick<Draft, "text" | "custom" | "link">, n: SocialNetwork) {
  const t = textFor(d, n);
  const r = NETWORKS[n];
  const linkExtra = d.link && n !== "instagram" && !t.includes(d.link) ? (r.linkCost ?? d.link.length) + 2 : 0;
  // X counts every URL already in the text as 23 too.
  const inText = r.linkCost ? t.replace(/https?:\/\/\S+/g, "x".repeat(r.linkCost)).length : t.length;
  return inText + linkExtra;
}

const hashtags = (t: string) => (t.match(/#[\p{L}\p{N}_]+/gu) ?? []).length;

export type Check = { network: SocialNetwork; level: "ok" | "warn" | "error"; message: string };

export function checks(d: Draft): Check[] {
  const out: Check[] = [];
  for (const n of d.networks) {
    const r = NETWORKS[n];
    const t = textFor(d, n);
    const len = charCount(d, n);
    const before = out.length;
    if (!t.trim() && !d.media.length) out.push({ network: n, level: "error", message: "la publication est vide." });
    if (len > r.limit) out.push({ network: n, level: "error", message: `texte trop long (${len} / ${r.limit} caractères).` });
    if (r.needsMedia && !d.media.length) out.push({ network: n, level: "error", message: "au moins une image est obligatoire." });
    if (d.media.length > r.maxImages) out.push({ network: n, level: "error", message: `${r.maxImages} images maximum.` });
    if (r.maxHashtags && hashtags(t) > r.maxHashtags) out.push({ network: n, level: "error", message: `${r.maxHashtags} hashtags maximum (${hashtags(t)}).` });
    if (n === "instagram" && d.link) out.push({ network: n, level: "warn", message: "les liens ne sont pas cliquables — mettez-le en bio ou en premier commentaire." });
    if (r.fold && len > r.fold && len <= r.limit) out.push({ network: n, level: "warn", message: `coupé après ~${r.fold} caractères (« voir plus »).` });
    if (n === "x" && len > 250 && len <= r.limit) out.push({ network: n, level: "warn", message: "proche de la limite." });
    if (out.length === before) out.push({ network: n, level: "ok", message: "prêt à publier." });
  }
  return out;
}

/** Opens the network's composer with the text pre-filled where the platform allows it. */
export function composeUrl(n: SocialNetwork, text: string) {
  if (n === "linkedin") return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
  if (n === "x") return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
  return "https://www.instagram.com/";
}

/** A scheduled post is "due" once its time has passed and some network is still waiting. */
export function pendingNetworks(networks: SocialNetwork[], published: SocialPublished) {
  return networks.filter((n) => !published[n]);
}

/* ------------------------------------------------------------------ */
/* Suggested time slots (Douala time) — editable in Comptes connectés  */
/* ------------------------------------------------------------------ */

export type Slot = { day: number; time: string }; // day: 1 = Monday … 7 = Sunday
export type SocialSettings = {
  accounts: Record<SocialNetwork, { handle: string; url: string }>;
  slots: Record<SocialNetwork, Slot[]>;
};

export const DEFAULT_SOCIAL: SocialSettings = {
  accounts: {
    linkedin: { handle: "", url: "" },
    instagram: { handle: "", url: "" },
    x: { handle: "", url: "" },
  },
  slots: {
    linkedin: [
      { day: 2, time: "08:30" },
      { day: 3, time: "09:00" },
      { day: 4, time: "08:00" },
    ],
    x: [
      { day: 3, time: "12:00" },
      { day: 4, time: "17:30" },
    ],
    instagram: [
      { day: 4, time: "18:00" },
      { day: 7, time: "11:00" },
    ],
  },
};

export const DAY_SHORT = ["", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."];

/** Douala is UTC+1 all year. */
const OFFSET_MS = 60 * 60 * 1000;

/** "YYYY-MM-DD" of a moment in Douala time. */
export const doualaDay = (d: Date = new Date()) => new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 10);

/** Next occurrence (after `from`) of any slot of the given networks, as an ISO string. */
export function nextSlot(networks: SocialNetwork[], slots: SocialSettings["slots"], from = new Date(), taken: string[] = []) {
  const all = networks.flatMap((n) => slots[n] ?? []);
  const list = all.length ? all : [{ day: 2, time: "09:00" }];
  const local = new Date(from.getTime() + OFFSET_MS); // shift to Douala wall clock (read with UTC getters)
  for (let d = 0; d < 21; d++) {
    const day = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + d));
    const iso = ((day.getUTCDay() + 6) % 7) + 1;
    const times = list.filter((s) => s.day === iso).map((s) => s.time).sort();
    for (const time of times) {
      const [h, m] = time.split(":").map(Number);
      const at = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m) - OFFSET_MS);
      if (at > from && !taken.includes(at.toISOString())) return at.toISOString();
    }
  }
  return new Date(from.getTime() + 86400000).toISOString();
}
