import type { Tone } from "./projects";

/**
 * Passions page data.
 * TODO: these figures are sample values from the design — replace them with
 * your real Steam / PSN stats (or wire the Studio admin later).
 */
export type Platform = "steam" | "ps";

export const platforms: Record<Platform, { name: string; color: string; total: number }> = {
  steam: { name: "Steam", color: "#1b2838", total: 60 },
  ps: { name: "PlayStation", color: "#00439c", total: 52 },
};

export const gamingProfiles = {
  steam: { id: "[Steam ID]", url: "https://steamcommunity.com" },
  ps: { id: "[PSN ID]", url: "https://www.playstation.com" },
};

export type Game = {
  name: string;
  platform: Platform;
  pct: number;
  hours: number;
  lastPlayedDaysAgo: number;
  tone: Tone;
};

export const games: Game[] = [
  { name: "Tekken 8", platform: "ps", pct: 78, hours: 412, lastPlayedDaysAgo: 0, tone: "terracotta" },
  { name: "God of War Ragnarök", platform: "ps", pct: 100, hours: 64, lastPlayedDaysAgo: 21, tone: "sand" },
  { name: "Ghost of Tsushima", platform: "ps", pct: 100, hours: 71, lastPlayedDaysAgo: 40, tone: "peach" },
  { name: "Marvel’s Spider-Man 2", platform: "ps", pct: 92, hours: 38, lastPlayedDaysAgo: 30, tone: "sage" },
  { name: "Astro Bot", platform: "ps", pct: 100, hours: 22, lastPlayedDaysAgo: 12, tone: "leaf" },
  { name: "EA Sports FC 25", platform: "ps", pct: 34, hours: 120, lastPlayedDaysAgo: 3, tone: "muted" },
  { name: "Street Fighter 6", platform: "steam", pct: 41, hours: 96, lastPlayedDaysAgo: 2, tone: "ink" },
  { name: "Elden Ring", platform: "steam", pct: 64, hours: 138, lastPlayedDaysAgo: 9, tone: "sand" },
  { name: "Hades", platform: "steam", pct: 100, hours: 85, lastPlayedDaysAgo: 15, tone: "terracotta" },
  { name: "Hollow Knight", platform: "steam", pct: 56, hours: 47, lastPlayedDaysAgo: 60, tone: "sage" },
  { name: "Celeste", platform: "steam", pct: 100, hours: 31, lastPlayedDaysAgo: 90, tone: "peach" },
  { name: "Guilty Gear -Strive-", platform: "steam", pct: 37, hours: 54, lastPlayedDaysAgo: 7, tone: "leaf" },
];

export const currentlyPlaying = {
  name: "Tekken 8",
  platform: "PlayStation 5",
  pct: 78,
  hours: 412,
};

export const music = {
  // TODO: fill in your song of the moment.
  title: "[Song title]",
  artist: "[Artist]",
  album: "[Album]",
  note: { en: "[Why this song right now.]", fr: "[Pourquoi ce morceau en ce moment.]" },
  spotifyUrl: "https://open.spotify.com",
  profileLabel: "[Spotify profile]",
  updatedAt: "2026-11-06",
  mood: {
    en: { title: "Focused", body: "Deep in a client build. Headphones on, notifications off." },
    fr: { title: "Concentré", body: "Plongé dans un projet client. Casque sur les oreilles, notifications coupées." },
  },
};
