import "server-only";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { games } from "@/db/schema";
import { setSetting } from "./portfolio";
import { TONE_KEYS } from "./tones";

/*
 * Steam Web API (https://steamcommunity.com/dev/apikey).
 * The profile and its "Game details" must be public for owned games and
 * achievements to be readable.
 */

const API = "https://api.steampowered.com";
/** Achievements are fetched for the most-played games only (one request each). */
const ACHIEVEMENT_GAMES = 40;

export class SteamError extends Error {}

function key() {
  const k = process.env.STEAM_API_KEY;
  if (!k) throw new SteamError("STEAM_API_KEY n'est pas configurée (.env.local).");
  return k;
}

export const steamConfigured = () => !!process.env.STEAM_API_KEY;

async function get<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const url = new URL(`${API}/${path}`);
  Object.entries({ key: key(), format: "json", ...params }).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (res.status === 403) throw new SteamError("Clé Steam refusée — vérifiez STEAM_API_KEY.");
  if (!res.ok) throw new SteamError(`Steam a répondu ${res.status}.`);
  return res.json() as Promise<T>;
}

/** Accepts a SteamID64, a profile URL (/profiles/… or /id/…) or a custom URL name. */
export async function resolveSteamId(input: string) {
  const raw = input.trim();
  const id64 = /(?:^|\/profiles\/)(\d{17})/.exec(raw)?.[1];
  if (id64) return id64;
  const vanity = /\/id\/([^/?#]+)/.exec(raw)?.[1] ?? raw.replace(/\/$/, "");
  const data = await get<{ response: { success: number; steamid?: string } }>("ISteamUser/ResolveVanityURL/v1/", { vanityurl: vanity });
  if (data.response.success !== 1 || !data.response.steamid) throw new SteamError(`Profil Steam « ${vanity} » introuvable.`);
  return data.response.steamid;
}

type OwnedGame = { appid: number; name: string; playtime_forever: number; rtime_last_played?: number };

async function achievements(steamid: string, appid: number) {
  try {
    const data = await get<{ playerstats?: { success?: boolean; achievements?: { achieved: number }[] } }>(
      "ISteamUserStats/GetPlayerAchievements/v1/",
      { steamid, appid },
    );
    const list = data.playerstats?.achievements;
    if (!data.playerstats?.success || !list?.length) return null;
    return { unlocked: list.filter((a) => a.achieved).length, total: list.length };
  } catch {
    return null; // games without achievements answer with an error
  }
}

/** Pulls owned games + achievements and upserts them. Returns the number of games synced. */
export async function syncSteam(input: string) {
  const steamid = await resolveSteamId(input);
  const owned = await get<{ response: { games?: OwnedGame[] } }>("IPlayerService/GetOwnedGames/v1/", {
    steamid,
    include_appinfo: 1,
    include_played_free_games: 1,
  });
  const list = (owned.response.games ?? []).filter((g) => g.playtime_forever > 0);
  if (!list.length) throw new SteamError("Aucun jeu lisible : le profil Steam et ses « Détails des jeux » doivent être publics.");

  const top = [...list].sort((a, b) => b.playtime_forever - a.playtime_forever).slice(0, ACHIEVEMENT_GAMES);
  const ach = new Map<number, { unlocked: number; total: number } | null>();
  // A few at a time, to stay polite with the API.
  for (let i = 0; i < top.length; i += 5) {
    const batch = top.slice(i, i + 5);
    const res = await Promise.all(batch.map((g) => achievements(steamid, g.appid)));
    batch.forEach((g, k) => ach.set(g.appid, res[k]));
  }

  await db.transaction(async (tx) => {
    // First real sync: drop the sample games.
    await tx.delete(games).where(isNull(games.steamAppId));
    for (const [i, g] of top.entries()) {
      const a = ach.get(g.appid) ?? null;
      const values = {
        name: g.name,
        playtime: g.playtime_forever,
        achievementsUnlocked: a?.unlocked ?? null,
        achievementsTotal: a?.total ?? null,
        lastPlayedAt: g.rtime_last_played ? new Date(g.rtime_last_played * 1000) : null,
        updatedAt: new Date(),
      };
      await tx
        .insert(games)
        .values({ steamAppId: g.appid, tone: TONE_KEYS[i % 6], ...values })
        .onConflictDoUpdate({ target: games.steamAppId, set: values });
    }
    // Nothing pinned yet → pin the most recently played game.
    const pinned = await tx.select({ id: games.id }).from(games).where(eq(games.pinned, true)).limit(1);
    if (!pinned.length) {
      const recent = [...top].sort((a, b) => (b.rtime_last_played ?? 0) - (a.rtime_last_played ?? 0))[0];
      await tx.update(games).set({ pinned: true }).where(eq(games.steamAppId, recent.appid));
    }
  });

  await setSetting("steam", {
    steamId: input.trim(),
    profileUrl: `https://steamcommunity.com/profiles/${steamid}`,
    lastSyncAt: new Date().toISOString(),
  });
  return top.length;
}
