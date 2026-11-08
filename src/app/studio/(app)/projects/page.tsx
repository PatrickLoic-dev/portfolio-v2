import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import { studioProjects } from "@/lib/portfolio";
import { ProjectsTable } from "./projects-table";

export const metadata: Metadata = { title: "Projets" };

export default async function ProjectsPage() {
  const list = await studioProjects();
  const visible = list.filter((p) => p.visible && p.status === "published").length;

  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Projets" }]}>
        <Link href="/studio/projects/new?type=personal" className="btn btn-ghost min-h-11 px-[18px] text-sm">
          <Plus size={16} aria-hidden />
          Projet perso
        </Link>
        <Link href="/studio/projects/new" className="btn btn-primary min-h-11 px-[18px] text-sm">
          <Plus size={16} aria-hidden />
          Nouveau projet
        </Link>
      </StudioTopBar>
      <div className="flex flex-col gap-[22px] p-[clamp(24px,3vw,40px)]">
        <StudioHeading
          kicker={`Portfolio · ${visible} visibles sur ${list.length}`}
          title="Projets"
          intro="L'ordre ici est l'ordre de la page Work (les projets persos ont leur propre section, dans le même ordre). Les projets « à la une » (5 maximum) apparaissent sur l'accueil."
        />
        <ProjectsTable
          projects={list.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            description: p.description,
            type: p.type,
            openSource: p.openSource,
            status: p.status,
            tags: p.tags,
            tone: p.tone,
            cover: p.media[0] ?? null,
            featured: p.featured,
            visible: p.visible,
          }))}
        />
      </div>
    </>
  );
}
