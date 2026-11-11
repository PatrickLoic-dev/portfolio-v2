"use server";

import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { games, projects, projectTranslations, songs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { lookupTrack, providerOf, type TrackInfo } from "@/lib/music-lookup";
import { MOOD_KEYS } from "@/lib/moods";
import { setSetting } from "@/lib/portfolio";
import { keepOrigin, recordRevision } from "@/lib/revisions";
import { slugify } from "@/lib/slug";
import { addFamilyGame, SteamError, syncSteam } from "@/lib/steam";
import { TONE_KEYS } from "@/lib/tones";
import type { ActionResult } from "./actions";

const MAX_FEATURED = 5;

function refresh() {
  revalidatePath("/studio", "layout");
  revalidatePath("/[locale]", "layout");
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

const projectText = z.object({
  description: z.string().max(400),
  sector: z.string().max(60),
  problemTitle: z.string().max(200),
  problem: z.string().max(5000),
  approachTitle: z.string().max(200),
  approach: z.string().max(5000),
  outcomeTitle: z.string().max(200),
  outcome: z.string().max(5000),
});

const projectInput = z.object({
  id: z.uuid().nullable(),
  slug: z.string().max(80),
  name: z.string().trim().min(1, "Donnez un nom au projet.").max(80),
  type: z.enum(["professional", "community", "personal"]),
  platform: z.enum(["web", "mobile"]),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
  client: z.string().max(80),
  role: z.string().max(80),
  liveUrl: z.union([z.url({ message: "Lien du projet invalide." }), z.literal("")]),
  openSource: z.boolean(),
  repoUrl: z.union([z.url({ message: "Lien du dépôt invalide." }), z.literal("")]),
  tone: z.enum(TONE_KEYS as [string, ...string[]]),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  media: z.array(z.url()).max(12),
  metrics: z.array(z.object({ value: z.string().max(20), labelEn: z.string().max(60), labelFr: z.string().max(60) })).max(3),
  translations: z.object({ en: projectText, fr: projectText }),
});
export type ProjectInput = z.infer<typeof projectInput>;

async function featuredCount(exceptId?: string | null) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(projects)
    .where(and(isNull(projects.deletedAt), eq(projects.featured, true), exceptId ? ne(projects.id, exceptId) : undefined));
  return n;
}

export async function saveProject(raw: ProjectInput): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();
  const parsed = projectInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const p = parsed.data;

  if (p.featured && (await featuredCount(p.id)) >= MAX_FEATURED)
    return { ok: false, error: `${MAX_FEATURED} projets maximum à la une, retirez-en un d'abord.` };

  const slug = slugify(p.slug || p.name) || `projet-${Date.now()}`;
  const clash = await db
    .select({ id: projects.id })
    .from(projects)
    .where(p.id ? and(eq(projects.slug, slug), ne(projects.id, p.id)) : eq(projects.slug, slug))
    .limit(1);
  if (clash.length) return { ok: false, error: `L'adresse /work/${slug} est déjà utilisée.` };

  const values = {
    slug,
    name: p.name,
    type: p.type,
    platform: p.platform,
    status: p.status,
    featured: p.featured,
    client: p.client.trim() || null,
    role: p.role.trim() || null,
    liveUrl: p.liveUrl || null,
    openSource: p.type === "personal" && p.openSource,
    repoUrl: p.repoUrl || null,
    tone: p.tone,
    tags: [...new Set(p.tags)],
    media: p.media,
    metrics: p.metrics,
    updatedAt: new Date(),
  };

  await keepOrigin("project", p.id);
  const id = await db.transaction(async (tx) => {
    let projectId = p.id;
    if (projectId) {
      await tx.update(projects).set(values).where(eq(projects.id, projectId));
    } else {
      const [{ max }] = await tx.select({ max: sql<number>`coalesce(max(${projects.position}), -1)::int` }).from(projects);
      const [row] = await tx.insert(projects).values({ ...values, position: max + 1 }).returning({ id: projects.id });
      projectId = row.id;
    }
    for (const locale of ["en", "fr"] as const) {
      const t = p.translations[locale];
      await tx
        .insert(projectTranslations)
        .values({ projectId, locale, ...t })
        .onConflictDoUpdate({ target: [projectTranslations.projectId, projectTranslations.locale], set: t });
    }
    return projectId;
  });
  await recordRevision("project", id, p.status === "published" ? "Publié" : "Brouillon");

  refresh();
  return { ok: true, data: { id, slug } };
}

export async function setProjectFlags(id: string, flags: { featured?: boolean; visible?: boolean }): Promise<ActionResult> {
  await requireAdmin();
  const projectId = z.uuid().parse(id);
  if (flags.featured && (await featuredCount(projectId)) >= MAX_FEATURED)
    return { ok: false, error: `${MAX_FEATURED} projets maximum à la une, retirez-en un d'abord.` };
  await db.update(projects).set({ ...flags, updatedAt: new Date() }).where(eq(projects.id, projectId));
  refresh();
  return { ok: true };
}

/** Moves a project one step up or down in the Work order. */
export async function moveProject(id: string, dir: -1 | 1): Promise<ActionResult> {
  await requireAdmin();
  const list = await db.select({ id: projects.id }).from(projects).where(isNull(projects.deletedAt)).orderBy(asc(projects.position), asc(projects.createdAt));
  const i = list.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  [list[i], list[j]] = [list[j], list[i]];
  await db.transaction(async (tx) => {
    for (const [k, p] of list.entries()) await tx.update(projects).set({ position: k }).where(eq(projects.id, p.id));
  });
  refresh();
  return { ok: true };
}

/**
 * Saves a full Work order (drag and drop in the Studio). Projects missing from
 * `ids` (e.g. created meanwhile in another tab) keep their relative order after.
 */
export async function reorderProjects(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.array(z.uuid()).max(500).safeParse(ids);
  if (!parsed.success) return { ok: false, error: "Ordre invalide." };
  const list = await db.select({ id: projects.id }).from(projects).where(isNull(projects.deletedAt)).orderBy(asc(projects.position), asc(projects.createdAt));
  const known = new Set(list.map((p) => p.id));
  const wanted = [...new Set(parsed.data)].filter((id) => known.has(id));
  const order = [...wanted, ...list.map((p) => p.id).filter((id) => !wanted.includes(id))];
  await db.transaction(async (tx) => {
    for (const [k, id] of order.entries()) await tx.update(projects).set({ position: k }).where(eq(projects.id, id));
  });
  refresh();
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.update(projects).set({ deletedAt: new Date(), featured: false }).where(eq(projects.id, z.uuid().parse(id)));
  refresh();
  return { ok: true };
}

export async function restoreProject(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.update(projects).set({ deletedAt: null }).where(eq(projects.id, z.uuid().parse(id)));
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Games                                                               */
/* ------------------------------------------------------------------ */

export async function syncSteamNow(steamId: string): Promise<ActionResult<{ count: number }>> {
  await requireAdmin();
  const id = z.string().trim().min(2, "Saisissez votre identifiant Steam.").max(200).safeParse(steamId);
  if (!id.success) return { ok: false, error: id.error.issues[0].message };
  try {
    const count = await syncSteam(id.data);
    refresh();
    return { ok: true, data: { count } };
  } catch (e) {
    return { ok: false, error: e instanceof SteamError ? e.message : "Steam ne répond pas. Réessayez plus tard." };
  }
}

export async function saveSteamOptions(opts: { autoSync: boolean }): Promise<ActionResult> {
  await requireAdmin();
  await setSetting("steam", { autoSync: z.boolean().parse(opts.autoSync) });
  return { ok: true };
}

export async function setGameFlags(id: string, flags: { visible?: boolean; pinned?: boolean }): Promise<ActionResult> {
  await requireAdmin();
  const gameId = z.uuid().parse(id);
  await db.transaction(async (tx) => {
    if (flags.pinned) await tx.update(games).set({ pinned: false }).where(eq(games.pinned, true));
    await tx.update(games).set(flags).where(eq(games.id, gameId));
  });
  refresh();
  return { ok: true };
}

/** Steam Family Sharing game, added from its Store link. */
export async function addFamilyGameNow(link: string, hours: number): Promise<ActionResult<{ name: string; withAchievements: boolean }>> {
  await requireAdmin();
  const h = z.number().min(0).max(100000).safeParse(hours);
  if (!h.success) return { ok: false, error: "Nombre d'heures invalide." };
  try {
    const res = await addFamilyGame(z.string().max(300).parse(link), h.data);
    refresh();
    return { ok: true, data: { name: res.name, withAchievements: !!res.achievements } };
  } catch (e) {
    return { ok: false, error: e instanceof SteamError ? e.message : "Steam ne répond pas. Réessayez plus tard." };
  }
}

/** Hours are only editable for family games (owned games get theirs from Steam). */
export async function setFamilyGameHours(id: string, hours: number): Promise<ActionResult> {
  await requireAdmin();
  const minutes = Math.round(z.number().min(0).max(100000).parse(hours) * 60);
  await db
    .update(games)
    .set({ playtime: minutes, updatedAt: new Date() })
    .where(and(eq(games.id, z.uuid().parse(id)), eq(games.family, true)));
  refresh();
  return { ok: true };
}

export async function removeFamilyGame(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(games).where(and(eq(games.id, z.uuid().parse(id)), eq(games.family, true)));
  refresh();
  return { ok: true };
}

export async function setMinPct(minPct: number): Promise<ActionResult> {
  await requireAdmin();
  await setSetting("games", { minPct: z.union([z.literal(0), z.literal(25), z.literal(50)]).parse(minPct) });
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Music                                                               */
/* ------------------------------------------------------------------ */

export async function fillFromLink(url: string): Promise<ActionResult<TrackInfo>> {
  await requireAdmin();
  const link = z.url().safeParse(url.trim());
  if (!link.success) return { ok: false, error: "Collez un lien Apple Music ou Spotify." };
  try {
    return { ok: true, data: await lookupTrack(link.data) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Impossible de lire ce lien." };
  }
}

const songInput = z.object({
  title: z.string().trim().min(1, "Donnez au moins un titre.").max(120),
  artist: z.string().max(120),
  album: z.string().max(120),
  artworkUrl: z.union([z.url(), z.literal("")]),
  link: z.union([z.url({ message: "Lien invalide." }), z.literal("")]),
  noteEn: z.string().max(140),
  noteFr: z.string().max(140),
  mood: z.enum(MOOD_KEYS as [string, ...string[]]),
  moodTextEn: z.string().max(120),
  moodTextFr: z.string().max(120),
});
export type SongInput = z.infer<typeof songInput>;

/** "Mettre à jour le site": the new row becomes the live song, older rows the history. */
export async function publishSong(raw: SongInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = songInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const s = parsed.data;
  await db.insert(songs).values({
    ...s,
    artworkUrl: s.artworkUrl || null,
    link: s.link || null,
    provider: s.link ? providerOf(s.link) : "other",
  });
  refresh();
  return { ok: true };
}

export async function saveMusicProfiles(p: { spotifyProfile: string; appleProfile: string }): Promise<ActionResult> {
  await requireAdmin();
  const url = z.union([z.url({ message: "URL de profil invalide." }), z.literal("")]);
  const parsed = z.object({ spotifyProfile: url, appleProfile: url }).safeParse(p);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await setSetting("music", parsed.data);
  refresh();
  return { ok: true };
}
