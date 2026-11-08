import type { Metadata } from "next";
import { ProjectEditor } from "../project-editor";

export const metadata: Metadata = { title: "Nouveau projet" };

const emptyText = {
  description: "",
  sector: "",
  problemTitle: "",
  problem: "",
  approachTitle: "",
  approach: "",
  outcomeTitle: "",
  outcome: "",
};

export default async function NewProjectPage({ searchParams }: PageProps<"/studio/projects/new">) {
  const personal = (await searchParams).type === "personal";
  return (
    <ProjectEditor
      initial={{
        id: null,
        slug: "",
        name: "",
        type: personal ? "personal" : "professional",
        platform: "web",
        status: "draft",
        featured: false,
        client: "",
        role: "",
        liveUrl: "",
        openSource: false,
        repoUrl: "",
        tone: "peach",
        tags: [],
        media: [],
        metrics: [],
        translations: { fr: { ...emptyText }, en: { ...emptyText } },
        updatedAt: null,
      }}
    />
  );
}
