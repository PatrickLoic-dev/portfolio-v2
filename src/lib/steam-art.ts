/** Public Steam store artwork for an app (no API key needed). Most games have all of them. */
const base = (appId: number) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}`;

export const steamArt = (appId: number | null | undefined) =>
  appId
    ? {
        /** 616×353 — game cards. */
        capsule: [`${base(appId)}/capsule_616x353.jpg`, `${base(appId)}/header.jpg`],
        /** 460×215 banner with the game's logo. */
        header: [`${base(appId)}/header.jpg`, `${base(appId)}/capsule_616x353.jpg`],
        /** 1920×620 key art without logo — backgrounds. */
        hero: [`${base(appId)}/library_hero.jpg`, `${base(appId)}/header.jpg`],
      }
    : null;
