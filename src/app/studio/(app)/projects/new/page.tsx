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

export default function NewProjectPage() {
  return (
    <ProjectEditor
      initial={{
        id: null,
        slug: "",
        name: "",
        type: "professional",
        platform: "web",
        status: "draft",
        featured: false,
        client: "",
        role: "",
        liveUrl: "",
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
