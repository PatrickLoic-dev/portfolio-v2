import "server-only";

export type TrackInfo = {
  provider: "apple" | "spotify" | "other";
  title: string;
  artist: string;
  album: string;
  artworkUrl: string | null;
};

export function providerOf(url: string): TrackInfo["provider"] {
  try {
    const host = new URL(url).host;
    if (host.endsWith("music.apple.com") || host.endsWith("itunes.apple.com")) return "apple";
    if (host.endsWith("spotify.com")) return "spotify";
  } catch {
    /* not a URL */
  }
  return "other";
}

/**
 * Fills a track from its link, without any API key:
 * - Apple Music → iTunes Lookup API (title, artist, album, artwork).
 * - Spotify → oEmbed (title and artwork; artist and album stay manual).
 */
export async function lookupTrack(url: string): Promise<TrackInfo> {
  const provider = providerOf(url);

  if (provider === "apple") {
    const u = new URL(url);
    const id = u.searchParams.get("i") ?? /\/(?:song|album)\/[^/]+\/(\d+)/.exec(u.pathname)?.[1] ?? /(\d{6,})\/?$/.exec(u.pathname)?.[1];
    if (!id) throw new Error("Lien Apple Music non reconnu.");
    const country = /^\/([a-z]{2})\//.exec(u.pathname)?.[1] ?? "us";
    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&country=${country}&entity=song`, { signal: AbortSignal.timeout(10000) });
    const data = (await res.json()) as {
      results?: { wrapperType: string; trackName?: string; collectionName?: string; artistName?: string; artworkUrl100?: string }[];
    };
    const item = data.results?.find((r) => r.wrapperType === "track") ?? data.results?.[0];
    if (!item) throw new Error("Morceau introuvable sur Apple Music.");
    return {
      provider,
      title: item.trackName ?? item.collectionName ?? "",
      artist: item.artistName ?? "",
      album: item.trackName ? (item.collectionName ?? "") : "",
      artworkUrl: item.artworkUrl100?.replace(/\/\d+x\d+bb\./, "/600x600bb.") ?? null,
    };
  }

  if (provider === "spotify") {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error("Lien Spotify non reconnu.");
    const data = (await res.json()) as { title?: string; thumbnail_url?: string };
    return { provider, title: data.title ?? "", artist: "", album: "", artworkUrl: data.thumbnail_url ?? null };
  }

  throw new Error("Collez un lien Apple Music ou Spotify.");
}
