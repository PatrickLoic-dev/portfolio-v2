import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { noteToEditor, studioGetNote, studioSubjects } from "@/lib/notes";
import { NoteEditor } from "../note-editor";

export const metadata: Metadata = { title: "Éditer une note" };

export default async function EditNotePage({ params }: PageProps<"/studio/notes/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [note, subjects] = await Promise.all([studioGetNote(id), studioSubjects()]);
  if (!note || note.deletedAt) notFound();

  return (
    <NoteEditor
      key={note.id}
      subjects={subjects.map((s) => ({ id: s.id, name: s.nameFr }))}
      initial={{ ...noteToEditor(note), updatedAt: note.updatedAt.toISOString() }}
    />
  );
}
