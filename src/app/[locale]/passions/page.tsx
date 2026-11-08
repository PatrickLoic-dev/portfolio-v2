import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { GamesExplorer, type PublicGame } from "@/components/passions/games-explorer";
import { SteamImage } from "@/components/passions/steam-image";
import { steamArt } from "@/lib/steam-art";
import { CtaFooter } from "@/components/site/site-footer";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { currentSong, daysSince, gamePct, getPublicGames, getSetting } from "@/lib/portfolio";
import { MOODS, type Mood } from "@/lib/moods";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/passions">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("passions") };
}

const PROVIDERS = {
  apple: { name: "Apple Music", bg: "#fa2d48", ink: "#ffffff" },
  spotify: { name: "Spotify", bg: "#1ed760", ink: "#251e19" },
} as const;

export default async function PassionsPage({ params }: PageProps<"/[locale]/passions">) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("passions");
  const cta = await getTranslations("cta");
  const process = await getTranslations("process");
  const format = await getFormatter();

  const [{ games, pinned }, steam, song, musicProfiles] = await Promise.all([
    getPublicGames(),
    getSetting("steam"),
    currentSong(),
    getSetting("music"),
  ]);

  const view: PublicGame[] = games.map((g) => ({
    id: g.id,
    name: g.name,
    pct: gamePct(g),
    unlocked: g.achievementsUnlocked,
    total: g.achievementsTotal,
    hours: Math.round(g.playtime / 60),
    daysAgo: daysSince(g.lastPlayedAt),
    tone: g.tone,
    appId: g.steamAppId,
  }));
  const withPct = view.filter((g) => g.pct !== null);
  const stats = [
    { label: t("games"), value: String(view.length) },
    { label: t("avgCompletion"), value: withPct.length ? `${Math.round(withPct.reduce((a, g) => a + (g.pct ?? 0), 0) / withPct.length)}%` : "—" },
    { label: t("perfect"), value: String(withPct.filter((g) => g.pct === 100).length) },
  ];
  const pinnedPct = pinned ? gamePct(pinned) : null;
  const pinnedArt = steamArt(pinned?.steamAppId);

  const mood = MOODS[(song?.mood as Mood) ?? "focused"] ?? MOODS.focused;
  const provider = song?.provider === "apple" || song?.provider === "spotify" ? PROVIDERS[song.provider] : null;
  const note = song ? (locale === "fr" ? song.noteFr : song.noteEn) || song.noteEn || song.noteFr : "";
  const moodText = song ? (locale === "fr" ? song.moodTextFr : song.moodTextEn) || song.moodTextEn || song.moodTextFr : "";
  const profiles = [
    musicProfiles.appleProfile && { ...PROVIDERS.apple, url: musicProfiles.appleProfile },
    musicProfiles.spotifyProfile && { ...PROVIDERS.spotify, url: musicProfiles.spotifyProfile },
  ].filter(Boolean) as { name: string; bg: string; ink: string; url: string }[];

  return (
    <>
      <section className="wrap pb-[72px] pt-[clamp(48px,7vw,96px)]">
        <div className="flex flex-wrap items-end justify-between gap-10">
          <div className="flex flex-col gap-6">
            <span className="label text-accent-ink">{t("eyebrow")}</span>
            <SplitHeadline as="h1" immediate text={t("title")} accent="." className="text-[clamp(72px,13vw,200px)]" />
          </div>
          <Reveal delay={0.2} className="flex max-w-[420px] flex-col gap-5">
            <p className="m-0 text-lg leading-relaxed text-muted-foreground">{t("intro")}</p>
            <div className="flex flex-wrap gap-2.5">
              <a href="#gaming" className="btn btn-ghost">{t("gaming")}</a>
              <a href="#music" className="btn btn-ghost">{t("music")}</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Gaming */}
      <section id="gaming" className="wrap flex scroll-mt-6 flex-col gap-8 pb-28">
        <div className="hairline flex flex-wrap items-end justify-between gap-6 border-t pt-12">
          <div className="flex flex-col gap-4">
            <span className="label text-accent-ink">{t("gamingEyebrow")}</span>
            <SplitHeadline text={t("gamingTitle")} className="text-[clamp(48px,7vw,104px)]" />
          </div>
          <p className="m-0 max-w-[380px] text-base leading-relaxed text-muted-foreground">{t("gamingBody")}</p>
        </div>

        <div className="flex flex-wrap gap-5">
          <Reveal className="flex flex-[1_1_380px] flex-col gap-[22px] rounded-3xl bg-[#1b2838] p-7 text-background">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                {steam.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={steam.avatarUrl} alt="" className="size-[52px] rounded-[14px] object-cover" />
                ) : (
                  <span aria-hidden className="flex size-[52px] items-center justify-center rounded-[14px] bg-background text-[13px] font-extrabold text-[#1b2838]">
                    STEAM
                  </span>
                )}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="label text-background/70">Steam</span>
                  <span className="truncate text-xl font-bold">{steam.personaName || "Steam"}</span>
                </div>
              </div>
              {steam.profileUrl && (
                <a href={steam.profileUrl} target="_blank" rel="noreferrer" className="btn min-h-11 bg-background text-[#1b2838]">
                  {t("profile")}
                </a>
              )}
            </div>
            <dl className="m-0 grid grid-cols-3 gap-3 border-t border-background/15 pt-[18px]">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse gap-1">
                  <dt className="label text-[11px] text-background/70">{s.label}</dt>
                  <dd className="display m-0 text-[40px]">{s.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {pinned && (
            <Reveal
              delay={0.08}
              className="relative isolate flex flex-[999_1_480px] flex-wrap items-center gap-8 overflow-hidden rounded-[28px] bg-ink p-[clamp(24px,4vw,40px)] text-background"
            >
              {pinnedArt && (
                <>
                  <SteamImage srcs={pinnedArt.hero} className="absolute inset-0 -z-20 size-full scale-105 object-cover" />
                  {/* Ink veil: keeps the text readable over any key art. */}
                  <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(37_30_25/0.55)_0%,rgb(37_30_25/0.7)_40%,rgb(37_30_25/0.35)_100%)]" />
                </>
              )}
              <div className="relative flex aspect-[16/10] flex-[1_1_220px] items-end overflow-hidden rounded-[18px] bg-accent p-5 shadow-[0_18px_40px_rgb(0_0_0/0.35)]">
                <span className="display text-[clamp(32px,3.6vw,48px)] text-ink">{pinned.name}</span>
                {pinnedArt && <SteamImage srcs={pinnedArt.header} alt={pinned.name} className="absolute inset-0 size-full object-cover" />}
              </div>
              <div className="flex flex-[999_1_260px] flex-col gap-4">
                <span className="label inline-flex items-center gap-2 text-blob-b">
                  <span className="size-2 animate-pulse rounded-full bg-blob-b" />
                  {t("currentlyPlaying")}
                </span>
                <h3 className="display text-[clamp(36px,4vw,56px)]">{pinned.name}</h3>
                {pinnedPct !== null && (
                  <div className="flex max-w-[520px] flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("achievements")}</span>
                      <b>{pinnedPct} %</b>
                    </div>
                    <div className="h-2.5 rounded-full bg-background/15">
                      <div className="h-2.5 rounded-full bg-blob-a" style={{ width: `${pinnedPct}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-5 font-mono text-[13px] text-background/70">
                  <span>{t("hoursPlayed", { hours: Math.round(pinned.playtime / 60) })}</span>
                  <span>Steam</span>
                </div>
              </div>
            </Reveal>
          )}
        </div>

        <GamesExplorer games={view} />
      </section>

      {/* Music */}
      {song && (
        <section id="music" className="scroll-mt-6 bg-surface">
          <div className="wrap flex flex-col gap-10 py-26">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex flex-col gap-4">
                <span className="label text-accent-ink">{t("musicEyebrow")}</span>
                <SplitHeadline text={t("musicTitle")} className="text-[clamp(48px,7vw,104px)]" />
              </div>
              <p className="m-0 max-w-[380px] text-base leading-relaxed text-muted-foreground">{t("musicBody")}</p>
            </div>

            <div className="flex flex-wrap items-stretch gap-5">
              <Reveal
                as="article"
                className="flex min-w-0 flex-[999_1_520px] flex-wrap items-center gap-7 rounded-[28px] bg-ink p-[clamp(24px,3vw,40px)] text-background"
              >
                <div
                  role="img"
                  aria-label={t("coverAlt")}
                  className="relative flex aspect-square flex-[0_0_220px] items-end justify-center overflow-hidden rounded-[18px] bg-blob-a p-7"
                >
                  {song.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={song.artworkUrl} alt="" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <div className="eq flex h-[90px] items-end gap-1.5" aria-hidden>
                      {[70, 90, 50, 80, 60].map((h, i) => (
                        <span key={i} style={{ height: h, animationDelay: `${[0, 0.2, 0.4, 0.1, 0.3][i]}s` }} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-[1_1_260px] flex-col gap-3.5">
                  <span className="label text-blob-b">{t("songOfMoment")}</span>
                  <h3 className="m-0 font-display text-[clamp(32px,3.6vw,52px)] font-extrabold leading-none tracking-[-0.03em]">{song.title}</h3>
                  {(song.artist || song.album) && (
                    <span className="text-lg text-background/70">{[song.artist, song.album].filter(Boolean).join(" · ")}</span>
                  )}
                  {note && <p className="m-0 text-[15px] leading-relaxed text-background/85">“{note}”</p>}
                  {song.link && (
                    <div className="mt-1 flex flex-wrap gap-2.5">
                      <a
                        href={song.link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn"
                        style={{ background: provider?.bg ?? "var(--card)", color: provider?.ink ?? "var(--foreground)" }}
                      >
                        {t("playOn", { provider: provider?.name ?? t("listen") })}
                      </a>
                    </div>
                  )}
                  <span className="font-mono text-xs text-background/60">
                    {t("updated", { when: format.relativeTime(song.createdAt, new Date()) })}
                  </span>
                </div>
              </Reveal>

              <div className="flex flex-[1_1_300px] flex-col gap-5">
                <Reveal delay={0.1} className="flex flex-1 flex-col justify-between gap-5 rounded-3xl p-7" style={{ background: mood.bg }}>
                  <span className="label">{t("mood")}</span>
                  <span className="display text-[64px]">{mood.label[locale]}</span>
                  {moodText && <span className="text-[15px] leading-normal">{moodText}</span>}
                </Reveal>
                {profiles.map((p, i) => (
                  <Reveal key={p.name} delay={0.15 + i * 0.05}>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hairline flex items-center justify-between gap-3.5 rounded-3xl border bg-card p-6 transition-colors hover:bg-background"
                    >
                      <span className="flex items-center gap-3.5">
                        <span className="flex size-12 items-center justify-center rounded-full text-sm font-bold" style={{ background: p.bg, color: p.ink }} aria-hidden>
                          ♪
                        </span>
                        <span className="font-bold">{t("followOn", { provider: p.name })}</span>
                      </span>
                      <ArrowUpRight size={18} aria-hidden />
                    </a>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <CtaFooter>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SplitHeadline text={process("ctaTitle")} accent="." className="text-[clamp(56px,9vw,136px)] text-background" />
          <Link href="/contact" className="btn btn-light">
            {cta("getInTouch")}
            <ArrowUpRight size={16} aria-hidden />
          </Link>
        </div>
      </CtaFooter>
    </>
  );
}
