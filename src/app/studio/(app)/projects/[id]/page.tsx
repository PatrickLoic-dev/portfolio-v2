import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ProjectMetric, ProjectTranslation } from "@/db/schema";
import { studioGetProject } from "@/lib/portfolio";
import { ProjectEditor } from "../project-editor";

export const metadata: Metadata = { title: "Éditer un projet" };

const text = (t: ProjectTranslation | null) => ({
  description: t?.description ?? "",
  sector: t?.sector ?? "",
  problemTitle: t?.problemTitle ?? "",
  problem: t?.problem ?? "",
  approachTitle: t?.approachTitle ?? "",
  approach: t?.approach ?? "",
  outcomeTitle: t?.outcomeTitle ?? "",
  outcome: t?.outcome ?? "",
});

export default async function EditProjectPage({ params }: PageProps<"/studio/projects/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const p = await studioGetProject(id);
  if (!p || p.deletedAt) notFound();

  return (
    <ProjectEditor
      key={p.id}
      initial={{
        id: p.id,
        slug: p.slug,
        name: p.name,
        type: p.type,
        platform: p.platform,
        status: p.status,
        featured: p.featured,
        client: p.client ?? "",
        role: p.role ?? "",
        liveUrl: p.liveUrl ?? "",
        openSource: p.openSource,
        repoUrl: p.repoUrl ?? "",
        tone: p.tone,
        tags: p.tags,
        media: p.media,
        metrics: p.metrics as ProjectMetric[],
        translations: { fr: text(p.translations.fr), en: text(p.translations.en) },
        updatedAt: p.updatedAt.toISOString(),
      }}
    />
  );
}
