import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import { studioCounts, studioListNotes, studioSubjects, type StatusFilter } from "@/lib/notes";
import { NotesTable } from "./notes-table";

const PAGES: Record<StatusFilter, { title: string; intro: string; empty: string }> = {
  all: {
    title: "Toutes les notes",
    intro: "Chaque note du blog, quel que soit son statut. Cochez-en plusieurs pour agir en lot.",
    empty: "Aucune note ne correspond à cette recherche.",
  },
  published: {
    title: "Notes publiées",
    intro: "Ce qui est en ligne sur le blog. Repassez une note en brouillon pour la retirer.",
    empty: "Aucune note publiée pour l'instant.",
  },
  draft: {
    title: "Brouillons",
    intro: "Les notes en cours d'écriture, triées par dernière modification.",
    empty: "Aucun brouillon, tout est publié.",
  },
  scheduled: {
    title: "Programmées",
    intro: "Les notes qui se publieront automatiquement à la date prévue.",
    empty: "Aucune publication programmée.",
  },
};

const isStatus = (v: unknown): v is StatusFilter => typeof v === "string" && v in PAGES;

export async function generateMetadata({ searchParams }: PageProps<"/studio/notes">): Promise<Metadata> {
  const { statut } = await searchParams;
  return { title: PAGES[isStatus(statut) ? statut : "all"].title };
}

export default async function NotesPage({ searchParams }: PageProps<"/studio/notes">) {
  const sp = await searchParams;
  const status: StatusFilter = isStatus(sp.statut) ? sp.statut : "all";
  const q = typeof sp.q === "string" ? sp.q : "";
  const subjectId = typeof sp.sujet === "string" ? sp.sujet : "";
  const page = PAGES[status];

  const [rows, counts, subjects] = await Promise.all([
    studioListNotes({ status, q, subjectId: subjectId || undefined }),
    studioCounts(),
    studioSubjects(),
  ]);

  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Notes", href: "/studio/notes" }, { label: page.title }]}>
        <Link href="/studio/notes/new" className="btn btn-primary min-h-11 px-[18px] text-sm">
          <Plus size={16} aria-hidden />
          Nouvelle note
        </Link>
      </StudioTopBar>
      <div className="flex flex-col gap-6 p-[clamp(24px,3vw,40px)]">
        <StudioHeading kicker={`Gérer · ${rows.length} sur ${counts.all} notes`} title={page.title} intro={page.intro} accent={false} />
        <NotesTable
          status={status}
          q={q}
          subjectId={subjectId}
          counts={counts}
          emptyText={page.empty}
          subjects={subjects.map((s) => ({ id: s.id, name: s.nameFr }))}
          rows={rows.map((r) => ({
            id: r.id,
            slug: r.slug,
            title: r.title,
            dek: r.dek,
            status: r.status,
            publishedAt: r.publishedAt?.toISOString() ?? null,
            updatedAt: r.updatedAt.toISOString(),
            tone: r.tone,
            coverUrl: r.coverUrl,
            subject: r.subject.nameFr,
            locales: r.locales,
          }))}
        />
      </div>
    </>
  );
}
