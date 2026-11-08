import type { Metadata } from "next";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import { daysSince, gamePct, getSetting, studioGames } from "@/lib/portfolio";
import { steamConfigured } from "@/lib/steam";
import { GamesManager } from "./games-manager";

export const metadata: Metadata = { title: "Jeux vidéo" };

export default async function GamesPage() {
  const [games, steam, opts] = await Promise.all([studioGames(), getSetting("steam"), getSetting("games")]);
  const shown = games.filter((g) => g.visible && (gamePct(g) ?? 0) >= opts.minPct).length;

  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Passions" }, { label: "Jeux vidéo" }]}>
        <a href="/passions" target="_blank" className="btn btn-ghost min-h-11 px-[18px] text-sm">
          Voir la page Passions ↗
        </a>
      </StudioTopBar>
      <div className="flex flex-col gap-[22px] p-[clamp(24px,3vw,40px)]">
        <StudioHeading
          kicker={`Passions · ${shown} jeux affichés sur ${games.length}`}
          title="Jeux vidéo"
          intro="Les heures et les succès viennent de Steam. Choisissez ce qui s'affiche sur le site et le jeu du moment."
        />
        <GamesManager
          configured={steamConfigured()}
          steam={steam}
          minPct={opts.minPct}
          sample={games.length > 0 && games.every((g) => g.steamAppId === null)}
          games={games.map((g) => ({
            id: g.id,
            name: g.name,
            pct: gamePct(g),
            hours: Math.round(g.playtime / 60),
            daysAgo: daysSince(g.lastPlayedAt),
            tone: g.tone,
            appId: g.steamAppId,
            visible: g.visible,
            pinned: g.pinned,
          }))}
        />
      </div>
    </>
  );
}
