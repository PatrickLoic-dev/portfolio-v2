import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { GamesExplorer } from "@/components/passions/games-explorer";
import { CtaFooter } from "@/components/site/site-footer";
import { currentlyPlaying, games, gamingProfiles, music, platforms, type Platform } from "@/content/passions";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/passions">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("passions") };
}

function stat(p: Platform) {
  const list = games.filter((g) => g.platform === p);
  return {
    count: list.length,
    avg: Math.round(list.reduce((a, g) => a + g.pct, 0) / list.length) + "%",
    full: list.filter((g) => g.pct === 100).length,
  };
}

export default async function PassionsPage({ params }: PageProps<"/[locale]/passions">) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("passions");
  const cta = await getTranslations("cta");
  const process = await getTranslations("process");
  const format = await getFormatter();

  const profiles = [
    { key: "steam" as const, badge: "STEAM", labels: [t("games"), t("avgCompletion"), t("perfect")] },
    { key: "ps" as const, badge: "PS", labels: [t("games"), t("avgTrophies"), t("platinums")] },
  ];

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

        <Stagger className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-5">
          {profiles.map(({ key, badge, labels }) => {
            const p = platforms[key];
            const s = stat(key);
            return (
              <StaggerItem key={key} className="flex flex-col gap-[22px] rounded-3xl p-7 text-background" style={{ background: p.color }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <span
                      aria-hidden
                      className="flex size-[52px] items-center justify-center rounded-[14px] bg-background text-[13px] font-extrabold"
                      style={{ color: p.color }}
                    >
                      {badge}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="label text-background/70">{key === "ps" ? "PlayStation Network" : p.name}</span>
                      <span className="text-xl font-bold">{gamingProfiles[key].id}</span>
                    </div>
                  </div>
                  <a href={gamingProfiles[key].url} className="btn min-h-11 bg-background" style={{ color: p.color }}>
                    {t("profile")}
                  </a>
                </div>
                <dl className="m-0 grid grid-cols-3 gap-3 border-t border-background/15 pt-[18px]">
                  {[s.count, s.avg, s.full].map((v, i) => (
                    <div key={i} className="flex flex-col-reverse gap-1">
                      <dt className="label text-[11px] text-background/70">{labels[i]}</dt>
                      <dd className="display m-0 text-[40px]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </StaggerItem>
            );
          })}
        </Stagger>

        <Reveal className="flex flex-wrap items-center gap-8 rounded-[28px] bg-ink p-[clamp(24px,4vw,48px)] text-background">
          <div className="flex aspect-[16/10] flex-[1_1_260px] items-end rounded-[18px] bg-accent p-5">
            <span className="display text-[52px] text-ink">{currentlyPlaying.name}</span>
          </div>
          <div className="flex flex-[999_1_420px] flex-col gap-4">
            <span className="label inline-flex items-center gap-2 text-blob-b">
              <span className="size-2 animate-pulse rounded-full bg-blob-b" />
              {t("currentlyPlaying")}
            </span>
            <h3 className="display text-[clamp(40px,5vw,72px)]">{currentlyPlaying.name}</h3>
            <p className="m-0 text-base leading-relaxed text-background/70">{t("currentBody")}</p>
            <div className="flex max-w-[520px] flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span>{t("trophies")}</span>
                <b>{currentlyPlaying.pct} %</b>
              </div>
              <div className="h-2.5 rounded-full bg-background/15">
                <div className="h-2.5 rounded-full bg-blob-a" style={{ width: `${currentlyPlaying.pct}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-5 font-mono text-[13px] text-background/70">
              <span>{t("hoursPlayed", { hours: currentlyPlaying.hours })}</span>
              <span>{currentlyPlaying.platform}</span>
            </div>
          </div>
        </Reveal>

        <GamesExplorer />
      </section>

      {/* Music */}
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
                className="flex aspect-square flex-[0_0_220px] items-end justify-center rounded-[18px] bg-blob-a p-7"
              >
                <div className="eq flex h-[90px] items-end gap-1.5" aria-hidden>
                  {[70, 90, 50, 80, 60].map((h, i) => (
                    <span key={i} style={{ height: h, animationDelay: `${[0, 0.2, 0.4, 0.1, 0.3][i]}s` }} />
                  ))}
                </div>
              </div>
              <div className="flex flex-[1_1_260px] flex-col gap-3.5">
                <span className="label text-blob-b">{t("songOfMoment")}</span>
                <h3 className="m-0 font-display text-[clamp(32px,3.6vw,52px)] font-extrabold leading-none tracking-[-0.03em]">
                  {music.title}
                </h3>
                <span className="text-lg text-background/70">
                  {music.artist} · {music.album}
                </span>
                <p className="m-0 text-[15px] leading-relaxed text-background/85">“{music.note[locale]}”</p>
                <div className="mt-1 flex flex-wrap gap-2.5">
                  <a href={music.spotifyUrl} className="btn bg-[#1ed760] text-ink">{t("playSpotify")}</a>
                </div>
                <span className="font-mono text-xs text-background/60">
                  {t("updated", { when: format.relativeTime(new Date(music.updatedAt), new Date()) })}
                </span>
              </div>
            </Reveal>

            <div className="flex flex-[1_1_300px] flex-col gap-5">
              <Reveal delay={0.1} className="flex flex-1 flex-col justify-between gap-5 rounded-3xl bg-blob-b p-7">
                <span className="label">{t("mood")}</span>
                <span className="display text-[64px]">{music.mood[locale].title}</span>
                <span className="text-[15px] leading-normal">{music.mood[locale].body}</span>
              </Reveal>
              <Reveal delay={0.2}>
                <a
                  href={music.spotifyUrl}
                  className="hairline flex items-center justify-between gap-3.5 rounded-3xl border bg-card p-6 transition-colors hover:bg-background"
                >
                  <span className="flex items-center gap-3.5">
                    <span className="flex size-12 items-center justify-center rounded-full bg-[#1ed760]" aria-hidden>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M6 9c4-1.4 8.5-1 12 1M7 12.5c3.4-1 7-.6 10 .9M8 15.8c2.6-.7 5.4-.4 7.6.7" />
                      </svg>
                    </span>
                    <span className="flex flex-col">
                      <span className="font-bold">{t("followSpotify")}</span>
                      <span className="text-[13px] text-muted-foreground">{music.profileLabel}</span>
                    </span>
                  </span>
                  <ArrowUpRight size={18} aria-hidden />
                </a>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

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
