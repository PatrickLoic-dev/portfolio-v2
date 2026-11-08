import { PenSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StudioTopBar } from "@/components/studio/page-header";
import { getSetting } from "@/lib/portfolio";
import { doualaDay } from "@/lib/social";
import { socialPostsBetween, socialQueue } from "@/lib/social-data";
import { CalendarView } from "./calendar-view";

export const metadata: Metadata = { title: "Calendrier" };

const OFFSET = 60 * 60 * 1000; // Douala, UTC+1

/** Monday 00:00 (Douala) of the week containing `ref`, as a UTC instant. */
function mondayOf(ref: Date) {
  const local = new Date(ref.getTime() + OFFSET);
  const dow = (local.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - dow) - OFFSET);
}

export default async function CalendarPage({ searchParams }: PageProps<"/studio/social/calendar">) {
  const { semaine } = await searchParams;
  const ref = typeof semaine === "string" && /^\d{4}-\d{2}-\d{2}$/.test(semaine) ? new Date(`${semaine}T12:00:00+01:00`) : new Date();
  const start = mondayOf(ref);
  const end = new Date(start.getTime() + 7 * 86400000);
  const [posts, queue, social] = await Promise.all([socialPostsBetween(start, end), socialQueue(), getSetting("social")]);

  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Réseaux sociaux", href: "/studio/social" }, { label: "Calendrier" }]}>
        <Link href="/studio/social/compose" className="btn btn-primary min-h-11 px-[18px] text-sm">
          <PenSquare size={16} aria-hidden />
          Composer
        </Link>
      </StudioTopBar>
      <CalendarView weekStart={start.toISOString()} today={doualaDay()} posts={posts} queue={queue} slots={social.slots} />
    </>
  );
}
