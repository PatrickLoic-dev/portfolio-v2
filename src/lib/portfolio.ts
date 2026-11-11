import "server-only";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { games, projects, projectTranslations, settings, songs, type Game, type Project, type ProjectMetric, type ProjectTranslation, type Song } from "@/db/schema";
import type { Locale } from "@/i18n/routing";
import { DEFAULT_SOCIAL, type SocialSettings } from "./social";
import type { Tone } from "./tones";

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

/** A project as the public site shows it, resolved to one language. */
export type PublicProject = {
  id: string;
  slug: string;
  n: string;
  name: string;
  type: "professional" | "community" | "personal";
  personal: boolean;
  openSource: boolean;
  repo: string | null;
  featured: boolean;
  mobile: boolean;
  tone: Tone;
  tags: string[];
  client: string | null;
  role: string | null;
  url: string | null;
  host: string;
  media: string[];
  metrics: { value: string; label: string }[];
  description: string;
  sector: string;
  sections: { key: "problem" | "approach" | "outcome"; title: string; body: string }[];
};

const hostOf = (url: string | null, slug: string) => {
  if (!url) return slug;
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return slug;
  }
};

function pick(list: ProjectTranslation[], locale: Locale) {
  const wanted = list.find((t) => t.locale === locale);
  if (wanted?.description.trim() || wanted?.problem.trim()) return wanted;
  return list.find((t) => t.locale !== locale) ?? wanted;
}

function toPublic(p: Project, texts: ProjectTranslation[], locale: Locale, index: number): PublicProject {
  const t = pick(texts.filter((x) => x.projectId === p.id), locale);
  return {
    id: p.id,
    slug: p.slug,
    n: String(index + 1).padStart(2, "0"),
    name: p.name,
    type: p.type,
    personal: p.type === "personal",
    openSource: p.openSource,
    repo: p.openSource ? p.repoUrl : null,
    featured: p.featured,
    mobile: p.platform === "mobile",
    tone: p.tone as Tone,
    tags: p.tags,
    client: p.client,
    role: p.role,
    url: p.liveUrl,
    host: hostOf(p.liveUrl, p.slug),
    media: p.media,
    metrics: (p.metrics as ProjectMetric[])
      .filter((m) => m.value.trim())
      .map((m) => ({ value: m.value, label: (locale === "fr" ? m.labelFr : m.labelEn) || m.labelEn || m.labelFr })),
    description: t?.description ?? "",
    sector: t?.sector ?? "",
    sections: (["problem", "approach", "outcome"] as const)
      .map((key) => ({ key, title: t?.[`${key}Title`] ?? "", body: t?.[key] ?? "" }))
      .filter((s) => s.body.trim() || s.title.trim()),
  };
}

const isPublic = () => and(isNull(projects.deletedAt), eq(projects.status, "published"), eq(projects.visible, true));

/**
 * Work page order. Client work and personal projects are numbered
 * separately ("01", "02"…), each in Studio order.
 */
export async function getPublicProjects(locale: Locale) {
  const rows = await db.select().from(projects).where(isPublic()).orderBy(asc(projects.position), asc(projects.createdAt));
  if (!rows.length) return [];
  const texts = await db.select().from(projectTranslations).where(inArray(projectTranslations.projectId, rows.map((r) => r.id)));
  const seen = { client: 0, personal: 0 };
  return rows.map((p) => toPublic(p, texts, locale, seen[p.type === "personal" ? "personal" : "client"]++));
}

/** A case study and the next one in the same group (client work or personal). */
export async function getPublicProject(slug: string, locale: Locale) {
  const all = await getPublicProjects(locale);
  const project = all.find((p) => p.slug === slug);
  if (!project) return null;
  const group = all.filter((p) => p.personal === project.personal);
  const i = group.indexOf(project);
  return { project, next: group.length > 1 ? group[(i + 1) % group.length] : null };
}

/* Studio --------------------------------------------------------------- */

export async function studioProjects() {
  const rows = await db.select().from(projects).where(isNull(projects.deletedAt)).orderBy(asc(projects.position), asc(projects.createdAt));
  const texts = rows.length
    ? await db.select().from(projectTranslations).where(inArray(projectTranslations.projectId, rows.map((r) => r.id)))
    : [];
  return rows.map((p) => ({ ...p, description: pick(texts.filter((t) => t.projectId === p.id), "fr")?.description ?? "" }));
}

export async function studioGetProject(id: string) {
  const [p] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!p) return null;
  const texts = await db.select().from(projectTranslations).where(eq(projectTranslations.projectId, id));
  return {
    ...p,
    translations: {
      en: texts.find((t) => t.locale === "en") ?? null,
      fr: texts.find((t) => t.locale === "fr") ?? null,
    },
  };
}

/** Tags already used on projects, most used first (Stack autocompletion). */
export async function studioProjectTags(): Promise<string[]> {
  const rows = await db.select({ tags: projects.tags }).from(projects).where(isNull(projects.deletedAt));
  const count = new Map<string, number>();
  rows.forEach((r) => r.tags.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)));
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
}

export async function projectNames() {
  return db.select({ slug: projects.slug, name: projects.name }).from(projects).where(isPublic()).orderBy(asc(projects.position));
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export type Settings = {
  steam: { steamId: string; profileUrl: string; personaName: string; avatarUrl: string; lastSyncAt: string | null; autoSync: boolean };
  games: { minPct: number };
  music: { spotifyProfile: string; appleProfile: string };
  social: SocialSettings;
};

const DEFAULTS: Settings = {
  steam: { steamId: "", profileUrl: "", personaName: "", avatarUrl: "", lastSyncAt: null, autoSync: true },
  games: { minPct: 0 },
  music: { spotifyProfile: "", appleProfile: "" },
  social: DEFAULT_SOCIAL,
};

export async function getSetting<K extends keyof Settings>(key: K): Promise<Settings[K]> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return { ...DEFAULTS[key], ...((row?.value as Partial<Settings[K]>) ?? {}) };
}

export async function setSetting<K extends keyof Settings>(key: K, patch: Partial<Settings[K]>) {
  const value = { ...(await getSetting(key)), ...patch };
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  return value;
}

/* ------------------------------------------------------------------ */
/* Games                                                               */
/* ------------------------------------------------------------------ */

/** Whole days since a date (null when unknown). */
export const daysSince = (d: Date | null) => (d ? Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000)) : null);

export const gamePct =(g: Pick<Game, "achievementsUnlocked" | "achievementsTotal">) =>
  g.achievementsTotal ? Math.round(((g.achievementsUnlocked ?? 0) / g.achievementsTotal) * 100) : null;

export async function studioGames() {
  return db.select().from(games).orderBy(desc(games.lastPlayedAt));
}

/** Games shown on the Passions page: visible, above the threshold, most-played first. */
export async function getPublicGames() {
  const [rows, opts] = await Promise.all([db.select().from(games).where(eq(games.visible, true)), getSetting("games")]);
  const list = rows.filter((g) => (gamePct(g) ?? 0) >= opts.minPct);
  return { games: list, pinned: rows.find((g) => g.pinned) ?? null, sample: rows.every((g) => g.steamAppId === null) };
}

/* ------------------------------------------------------------------ */
/* Music                                                               */
/* ------------------------------------------------------------------ */

export async function currentSong(): Promise<Song | null> {
  const [row] = await db.select().from(songs).orderBy(desc(songs.createdAt)).limit(1);
  return row ?? null;
}

export async function songHistory(limit = 6) {
  return db.select().from(songs).orderBy(desc(songs.createdAt)).limit(limit + 1);
}

type StudioProject = NonNullable<Awaited<ReturnType<typeof studioGetProject>>>;

/** A project in the editor's shape (also what the version history stores). */
export function projectToEditor(p: StudioProject) {
  const text = (t: ProjectTranslation | null) => ({
    description: t?.description ?? "",
    sector: t?.sector ?? "",
    problemTitle: t?.problemTitle ?? "",
    problem: t?.problem ?? "",
    approachTitle: t?.approachTitle ?? "",
    approach: t?.approach ?? "",
    outcomeTitle: t?.outcomeTitle ?? "",
    outcome: t?.outcome ?? "",
  });
  return {
    id: p.id as string | null,
    slug: p.slug,
    name: p.name,
    type: p.type,
    platform: p.platform,
    status: p.status,
    featured: p.featured,
    client: p.client ?? "",
    role: p.role ?? "",
    liveUrl: p.liveUrl ?? "",
    openSource: p.openSource,
    repoUrl: p.repoUrl ?? "",
    tone: p.tone,
    tags: p.tags,
    media: p.media,
    metrics: p.metrics as ProjectMetric[],
    translations: { fr: text(p.translations.fr), en: text(p.translations.en) },
  };
}
export type ProjectSnapshot = ReturnType<typeof projectToEditor>;

/** A project opened through a preview link: drafts and hidden projects too. */
export async function getPreviewProject(id: string, locale: Locale): Promise<PublicProject | null> {
  const [p] = await db.select().from(projects).where(and(eq(projects.id, id), isNull(projects.deletedAt))).limit(1);
  if (!p) return null;
  const texts = await db.select().from(projectTranslations).where(eq(projectTranslations.projectId, id));
  return toPublic(p, texts, locale, 0);
}
