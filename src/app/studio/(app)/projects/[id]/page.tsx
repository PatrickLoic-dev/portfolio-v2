import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projectToEditor, studioGetProject, studioProjectTags } from "@/lib/portfolio";
import { ProjectEditor } from "../project-editor";

export const metadata: Metadata = { title: "Éditer un projet" };

export default async function EditProjectPage({ params }: PageProps<"/studio/projects/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [p, usedTags] = await Promise.all([studioGetProject(id), studioProjectTags()]);
  if (!p || p.deletedAt) notFound();

  return <ProjectEditor key={p.id} usedTags={usedTags} initial={{ ...projectToEditor(p), updatedAt: p.updatedAt.toISOString() }} />;
}
