import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Tone } from "@/content/projects";
import { studioGetNote, studioSubjects } from "@/lib/notes";
import { NoteEditor } from "../note-editor";

export const metadata: Metadata = { title: "Éditer une note" };

const pick = (t: { title: string; dek: string; hook: string; body: string; seoDescription: string } | null) => ({
  title: t?.title ?? "",
  dek: t?.dek ?? "",
  hook: t?.hook ?? "",
  body: t?.body ?? "",
  seoDescription: t?.seoDescription ?? "",
});

export default async function EditNotePage({ params }: PageProps<"/studio/notes/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [note, subjects] = await Promise.all([studioGetNote(id), studioSubjects()]);
  if (!note || note.deletedAt) notFound();

  return (
    <NoteEditor
      key={note.id}
      subjects={subjects.map((s) => ({ id: s.id, name: s.nameFr }))}
      initial={{
        id: note.id,
        slug: note.slug,
        subjectId: note.subjectId,
        status: note.status,
        publishedAt: note.publishedAt?.toISOString() ?? null,
        tone: note.tone as Tone,
        coverUrl: note.coverUrl,
        tags: note.tags,
        featured: note.featured,
        updatedAt: note.updatedAt.toISOString(),
        translations: { fr: pick(note.translations.fr), en: pick(note.translations.en) },
      }}
    />
  );
}
