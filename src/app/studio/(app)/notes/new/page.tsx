import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { ideas } from "@/db/schema";
import { studioSubjects } from "@/lib/notes";
import { NoteEditor } from "../note-editor";

export const metadata: Metadata = { title: "Nouvelle note" };

const empty = { title: "", dek: "", hook: "", body: "", seoDescription: "" };

export default async function NewNotePage({ searchParams }: PageProps<"/studio/notes/new">) {
  const { idee } = await searchParams;
  const subjects = await studioSubjects();
  const idea =
    typeof idee === "string" && /^[0-9a-f-]{36}$/.test(idee)
      ? (await db.select().from(ideas).where(eq(ideas.id, idee)).limit(1))[0]
      : undefined;

  if (!subjects.length) {
    return (
      <div className="flex flex-col items-start gap-4 p-10">
        <h1 className="display text-5xl">Aucun sujet</h1>
        <p className="m-0 text-muted-foreground">Créez d&apos;abord un sujet pour classer vos notes.</p>
        <Link href="/studio/subjects" className="btn btn-primary">
          Créer un sujet
        </Link>
      </div>
    );
  }

  return (
    <NoteEditor
      ideaId={idea?.id ?? null}
      subjects={subjects.map((s) => ({ id: s.id, name: s.nameFr }))}
      initial={{
        id: null,
        slug: "",
        subjectId: subjects[0].id,
        status: "draft",
        publishedAt: null,
        tone: "peach",
        coverUrl: null,
        tags: [],
        featured: false,
        updatedAt: null,
        translations: { fr: { ...empty, title: idea?.title ?? "" }, en: { ...empty } },
      }}
    />
  );
}
