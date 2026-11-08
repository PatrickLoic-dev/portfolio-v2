import type { Metadata } from "next";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import { getSetting, songHistory } from "@/lib/portfolio";
import { MusicEditor } from "./music-editor";

export const metadata: Metadata = { title: "Musique & humeur" };

export default async function MusicPage() {
  const [history, profiles] = await Promise.all([songHistory(6), getSetting("music")]);
  const [current, ...older] = history;

  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Passions" }, { label: "Musique & humeur" }]}>
        <a href="/passions#music" target="_blank" className="btn btn-ghost min-h-11 px-[18px] text-sm">
          Voir sur le site ↗
        </a>
      </StudioTopBar>
      <div className="flex flex-col gap-[22px] p-[clamp(24px,3vw,40px)]">
        <StudioHeading kicker="Passions · En ce moment" title="Musique & humeur" />
        <MusicEditor
          profiles={profiles}
          initial={{
            title: current?.title ?? "",
            artist: current?.artist ?? "",
            album: current?.album ?? "",
            artworkUrl: current?.artworkUrl ?? "",
            link: current?.link ?? "",
            noteEn: current?.noteEn ?? "",
            noteFr: current?.noteFr ?? "",
            mood: current?.mood ?? "focused",
            moodTextEn: current?.moodTextEn ?? "",
            moodTextFr: current?.moodTextFr ?? "",
          }}
          history={older.map((s) => ({
            id: s.id,
            title: s.title,
            artist: s.artist,
            album: s.album,
            artworkUrl: s.artworkUrl ?? "",
            link: s.link ?? "",
            noteEn: s.noteEn,
            noteFr: s.noteFr,
            mood: s.mood,
            moodTextEn: s.moodTextEn,
            moodTextFr: s.moodTextFr,
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      </div>
    </>
  );
}
