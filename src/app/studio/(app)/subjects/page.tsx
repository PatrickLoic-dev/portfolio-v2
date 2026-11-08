import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import type { Tone } from "@/lib/tones";
import { studioSubjects } from "@/lib/notes";
import { SubjectsManager } from "./subjects-manager";

export const metadata: Metadata = { title: "Sujets" };

export default async function SubjectsPage() {
  const subjects = await studioSubjects();
  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Sujets" }]}>
        <Link href="/studio/notes/new" className="btn btn-primary min-h-11 px-[18px] text-sm">
          <Plus size={16} aria-hidden />
          Nouvelle note
        </Link>
      </StudioTopBar>
      <div className="flex flex-col gap-6 p-[clamp(24px,3vw,40px)]">
        <StudioHeading
          kicker={`Organisation · ${subjects.length} sujets`}
          title="Sujets"
          accent={false}
          intro="Les sujets classent vos notes et deviennent les filtres de la page Blog. Un sujet ne peut être supprimé que s'il ne contient aucune note."
        />
        <SubjectsManager
          subjects={subjects.map((s) => ({
            id: s.id,
            slug: s.slug,
            nameFr: s.nameFr,
            nameEn: s.nameEn,
            descriptionFr: s.descriptionFr,
            descriptionEn: s.descriptionEn,
            tone: s.tone as Tone,
            count: s.count,
          }))}
        />
      </div>
    </>
  );
}
