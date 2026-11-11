"use server";

import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { ideas, notes, noteTranslations, subjects, type NoteStatus } from "@/db/schema";
import { isAdminEmail, requireAdmin } from "@/lib/auth";
import { keepOrigin, recordRevision } from "@/lib/revisions";
import { slugify } from "@/lib/slug";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const TONES = ["peach", "leaf", "sand", "sage", "terracotta", "muted", "surface", "ink"] as const;

function refresh() {
  revalidatePath("/studio", "layout");
  revalidatePath("/[locale]/blog", "layout");
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export type LoginState = { error?: string };

export async function signIn(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Renseignez votre email et votre mot de passe." };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !isAdminEmail(data.user?.email)) {
    if (data.user) await supabase.auth.signOut();
    return { error: "Identifiants incorrects." };
  }
  redirect("/studio");
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/studio/login");
}

/* ------------------------------------------------------------------ */
/* Notes                                                               */
/* ------------------------------------------------------------------ */

const translation = z.object({
  title: z.string().max(200),
  dek: z.string().max(600),
  hook: z.string().max(80),
  body: z.string().max(100_000),
  seoDescription: z.string().max(320),
});

const noteInput = z.object({
  id: z.uuid().nullable(),
  slug: z.string().max(80),
  subjectId: z.uuid({ message: "Choisissez un sujet." }),
  status: z.enum(["draft", "published", "scheduled"]),
  publishedAt: z.iso.datetime({ offset: true }).nullable(),
  tone: z.enum(TONES),
  coverUrl: z.url().nullable(),
  tags: z.array(z.string().max(40)).max(20),
  featured: z.boolean(),
  ideaId: z.uuid().nullable().optional(),
  translations: z.object({ en: translation, fr: translation }),
});
export type NoteInput = z.infer<typeof noteInput>;

export async function saveNote(raw: NoteInput): Promise<ActionResult<{ id: string; slug: string; status: NoteStatus; publishedAt: string | null }>> {
  await requireAdmin();
  const parsed = noteInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const input = parsed.data;

  const { en, fr } = input.translations;
  const title = fr.title.trim() || en.title.trim();
  if (input.status !== "draft" && !title) return { ok: false, error: "Donnez un titre à la note avant de la publier." };

  let publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
  if (input.status === "published" && !publishedAt) publishedAt = new Date();
  // "Published" with a future date is really a scheduled note.
  if (input.status === "published" && publishedAt && publishedAt > new Date()) input.status = "scheduled";
  if (input.status === "scheduled") {
    if (!publishedAt) return { ok: false, error: "Choisissez une date de publication." };
    if (publishedAt <= new Date()) return { ok: false, error: "La date programmée doit être dans le futur." };
  }

  const slug = slugify(input.slug || en.title || fr.title || "note") || `note-${Date.now()}`;
  const clash = await db
    .select({ id: notes.id })
    .from(notes)
    .where(input.id ? and(eq(notes.slug, slug), ne(notes.id, input.id)) : eq(notes.slug, slug))
    .limit(1);
  if (clash.length) return { ok: false, error: `L'adresse /blog/${slug} est déjà utilisée par une autre note.` };

  const values = {
    slug,
    subjectId: input.subjectId,
    status: input.status,
    publishedAt,
    tone: input.tone,
    coverUrl: input.coverUrl,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    featured: input.featured,
    updatedAt: new Date(),
  };

  await keepOrigin("note", input.id);
  const id = await db.transaction(async (tx) => {
    let noteId = input.id;
    if (noteId) {
      await tx.update(notes).set(values).where(eq(notes.id, noteId));
    } else {
      const [row] = await tx.insert(notes).values(values).returning({ id: notes.id });
      noteId = row.id;
    }
    // Only one featured note at a time.
    if (input.featured) await tx.update(notes).set({ featured: false }).where(ne(notes.id, noteId));

    for (const locale of ["en", "fr"] as const) {
      const t = input.translations[locale];
      await tx
        .insert(noteTranslations)
        .values({ noteId, locale, ...t })
        .onConflictDoUpdate({ target: [noteTranslations.noteId, noteTranslations.locale], set: t });
    }
    if (input.ideaId) await tx.delete(ideas).where(eq(ideas.id, input.ideaId));
    return noteId;
  });
  await recordRevision("note", id, { published: "Publiée", scheduled: "Programmée", draft: "Brouillon" }[input.status]);

  refresh();
  return { ok: true, data: { id, slug, status: input.status, publishedAt: publishedAt?.toISOString() ?? null } };
}

/** Bulk status change from the notes list. */
export async function setNotesStatus(ids: string[], status: "published" | "draft"): Promise<ActionResult> {
  await requireAdmin();
  const list = z.array(z.uuid()).min(1).parse(ids);
  await db
    .update(notes)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === "published" ? { publishedAt: sql`coalesce(${notes.publishedAt}, now())` } : {}),
    })
    .where(inArray(notes.id, list));
  refresh();
  return { ok: true };
}

/** Soft delete — restorable with restoreNotes. */
export async function deleteNotes(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const list = z.array(z.uuid()).min(1).parse(ids);
  await db.update(notes).set({ deletedAt: new Date() }).where(inArray(notes.id, list));
  refresh();
  return { ok: true };
}

export async function restoreNotes(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const list = z.array(z.uuid()).min(1).parse(ids);
  await db.update(notes).set({ deletedAt: null }).where(inArray(notes.id, list));
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Images                                                              */
/* ------------------------------------------------------------------ */

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function uploadImage(form: FormData): Promise<ActionResult<{ url: string }>> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Aucun fichier." };
  // SVG only for logos (shown through <img>, where scripts never run).
  const svg = form.get("svg") === "1" && file.type === "image/svg+xml";
  if (!IMAGE_TYPES.includes(file.type) && !svg) return { ok: false, error: form.get("svg") === "1" ? "Format accepté : SVG, PNG, WebP, AVIF ou JPG." : "Format accepté : JPG, PNG, WebP ou AVIF." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Image trop lourde (5 Mo maximum)." };

  const ext = svg ? "svg" : file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.storage.from("covers").upload(path, file, { contentType: file.type });
  if (error) return { ok: false, error: "L'envoi a échoué. Réessayez." };
  return { ok: true, data: { url: supabase.storage.from("covers").getPublicUrl(path).data.publicUrl } };
}

/* ------------------------------------------------------------------ */
/* Subjects                                                            */
/* ------------------------------------------------------------------ */

const subjectInput = z.object({
  nameFr: z.string().trim().min(1, "Donnez un nom au sujet.").max(40),
  nameEn: z.string().trim().max(40),
  descriptionFr: z.string().trim().max(160),
  descriptionEn: z.string().trim().max(160),
  tone: z.enum(TONES),
});
export type SubjectInput = z.infer<typeof subjectInput>;

async function nameTaken(name: string, exceptId?: string) {
  const rows = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(
      and(
        sql`(lower(${subjects.nameFr}) = lower(${name}) or lower(${subjects.nameEn}) = lower(${name}))`,
        exceptId ? ne(subjects.id, exceptId) : undefined,
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function createSubject(raw: SubjectInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = subjectInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const s = parsed.data;
  if (await nameTaken(s.nameFr)) return { ok: false, error: "Ce sujet existe déjà." };

  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${subjects.position}), -1)::int` }).from(subjects);
  let slug = slugify(s.nameEn || s.nameFr) || "sujet";
  if ((await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.slug, slug))).length) slug = `${slug}-${Date.now() % 10000}`;

  await db.insert(subjects).values({ ...s, nameEn: s.nameEn || s.nameFr, slug, position: max + 1 });
  refresh();
  return { ok: true };
}

export async function updateSubject(id: string, raw: SubjectInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = subjectInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const s = parsed.data;
  if (await nameTaken(s.nameFr, id)) return { ok: false, error: "Nom vide ou déjà utilisé." };
  // The slug stays stable so public filter links keep working.
  await db.update(subjects).set({ ...s, nameEn: s.nameEn || s.nameFr }).where(eq(subjects.id, z.uuid().parse(id)));
  refresh();
  return { ok: true };
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  await requireAdmin();
  const subjectId = z.uuid().parse(id);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(notes).where(eq(notes.subjectId, subjectId));
  if (n > 0) return { ok: false, error: "Impossible : ce sujet contient des notes." };
  await db.delete(subjects).where(eq(subjects.id, subjectId));
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Ideas                                                               */
/* ------------------------------------------------------------------ */

export async function addIdea(title: string): Promise<ActionResult> {
  await requireAdmin();
  const t = z.string().trim().min(1).max(200).safeParse(title);
  if (!t.success) return { ok: false, error: "Écrivez d'abord l'idée." };
  await db.insert(ideas).values({ title: t.data });
  revalidatePath("/studio");
  return { ok: true };
}

export async function deleteIdea(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(ideas).where(eq(ideas.id, z.uuid().parse(id)));
  revalidatePath("/studio");
  return { ok: true };
}
