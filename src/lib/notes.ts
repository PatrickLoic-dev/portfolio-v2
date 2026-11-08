import "server-only";
import { and, asc, desc, eq, ilike, inArray, isNotNull, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { ideas, notes, noteTranslations, subjects, type Note, type NoteStatus, type NoteTranslation, type Subject } from "@/db/schema";
import type { Locale } from "@/i18n/routing";
import type { Tone } from "@/content/projects";
import { extractToc, readingMinutes } from "./slug";

/* ------------------------------------------------------------------ */
/* Shared shapes                                                       */
/* ------------------------------------------------------------------ */

export type LocalizedSubject = {
  id: string;
  slug: string;
  label: string;
  description: string;
  tone: Tone;
};

/** A note as the public blog shows it, already resolved to one language. */
export type PublicPost = {
  id: string;
  slug: string;
  subject: LocalizedSubject;
  date: string; // ISO
  minutes: number;
  tone: Tone;
  coverUrl: string | null;
  featured: boolean;
  relatedProject: string | null;
  tags: string[];
  title: string;
  excerpt: string;
  hook: string;
  body: string;
  seoDescription: string;
  toc: { id: string; label: string }[];
  /** Locale the text actually comes from (falls back when a translation is missing). */
  textLocale: Locale;
};

function localizeSubject(s: Subject, locale: Locale): LocalizedSubject {
  return {
    id: s.id,
    slug: s.slug,
    label: (locale === "fr" ? s.nameFr : s.nameEn) || s.nameEn || s.nameFr,
    description: (locale === "fr" ? s.descriptionFr : s.descriptionEn) || s.descriptionEn,
    tone: s.tone as Tone,
  };
}

/** Pick the requested translation, or the other one when it has no title yet. */
function pickText(list: NoteTranslation[], locale: Locale) {
  const wanted = list.find((t) => t.locale === locale);
  if (wanted?.title.trim()) return wanted;
  return list.find((t) => t.locale !== locale && t.title.trim()) ?? wanted ?? list[0];
}

/** Published, or scheduled with a date that has passed — and not in the bin. */
const isLive = () =>
  and(
    isNull(notes.deletedAt),
    isNotNull(notes.publishedAt),
    lte(notes.publishedAt, sql`now()`),
    or(eq(notes.status, "published"), eq(notes.status, "scheduled")),
  );

async function hydrate(rows: Note[], locale: Locale): Promise<PublicPost[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [texts, subs] = await Promise.all([
    db.select().from(noteTranslations).where(inArray(noteTranslations.noteId, ids)),
    db.select().from(subjects),
  ]);
  const subById = new Map(subs.map((s) => [s.id, s]));
  return rows.map((n) => {
    const text = pickText(texts.filter((t) => t.noteId === n.id), locale);
    const body = text?.body ?? "";
    return {
      id: n.id,
      slug: n.slug,
      subject: localizeSubject(subById.get(n.subjectId)!, locale),
      date: (n.publishedAt ?? n.createdAt).toISOString(),
      minutes: readingMinutes(body),
      tone: n.tone as Tone,
      coverUrl: n.coverUrl,
      featured: n.featured,
      relatedProject: n.relatedProject,
      tags: n.tags,
      title: text?.title ?? "",
      excerpt: text?.dek ?? "",
      hook: text?.hook || text?.title || "",
      body,
      seoDescription: text?.seoDescription || text?.dek || "",
      toc: extractToc(body),
      textLocale: (text?.locale ?? locale) as Locale,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Public blog                                                         */
/* ------------------------------------------------------------------ */

export async function getPublishedPosts(locale: Locale) {
  const rows = await db.select().from(notes).where(isLive()).orderBy(desc(notes.publishedAt));
  return hydrate(rows, locale);
}

export async function getPublishedPost(slug: string, locale: Locale) {
  const rows = await db.select().from(notes).where(and(isLive(), eq(notes.slug, slug))).limit(1);
  return (await hydrate(rows, locale))[0] ?? null;
}

export async function getPublicSubjects(locale: Locale) {
  const rows = await db.select().from(subjects).orderBy(asc(subjects.position), asc(subjects.createdAt));
  return rows.map((s) => localizeSubject(s, locale));
}

/* ------------------------------------------------------------------ */
/* Studio                                                              */
/* ------------------------------------------------------------------ */

/** Scheduled notes whose date has passed become "published" (keeps Studio counts honest). */
export async function promoteDueNotes() {
  await db
    .update(notes)
    .set({ status: "published" })
    .where(and(eq(notes.status, "scheduled"), isNotNull(notes.publishedAt), lte(notes.publishedAt, sql`now()`), isNull(notes.deletedAt)));
}

export type StudioNoteRow = {
  id: string;
  slug: string;
  status: NoteStatus;
  publishedAt: Date | null;
  updatedAt: Date;
  tone: Tone;
  coverUrl: string | null;
  subject: Subject;
  title: string;
  dek: string;
  /** Locales that have a title. */
  locales: Locale[];
};

export type StatusFilter = "all" | NoteStatus;

export async function studioListNotes(opts: { status?: StatusFilter; q?: string; subjectId?: string } = {}) {
  const where: SQL[] = [isNull(notes.deletedAt)];
  if (opts.status && opts.status !== "all") where.push(eq(notes.status, opts.status));
  if (opts.subjectId) where.push(eq(notes.subjectId, opts.subjectId));
  if (opts.q?.trim()) {
    const like = `%${opts.q.trim()}%`;
    const match = db
      .select({ id: noteTranslations.noteId })
      .from(noteTranslations)
      .where(or(ilike(noteTranslations.title, like), ilike(noteTranslations.dek, like)));
    where.push(inArray(notes.id, match));
  }

  const order =
    opts.status === "scheduled"
      ? [asc(notes.publishedAt)]
      : opts.status === "draft"
        ? [desc(notes.updatedAt)]
        : [desc(sql`coalesce(${notes.publishedAt}, ${notes.updatedAt})`)];

  const rows = await db.select().from(notes).where(and(...where)).orderBy(...order);
  return decorate(rows);
}

async function decorate(rows: Note[]): Promise<StudioNoteRow[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [texts, subs] = await Promise.all([
    db.select().from(noteTranslations).where(inArray(noteTranslations.noteId, ids)),
    db.select().from(subjects),
  ]);
  const subById = new Map(subs.map((s) => [s.id, s]));
  return rows.map((n) => {
    const mine = texts.filter((t) => t.noteId === n.id);
    const text = pickText(mine, "fr");
    return {
      id: n.id,
      slug: n.slug,
      status: n.status,
      publishedAt: n.publishedAt,
      updatedAt: n.updatedAt,
      tone: n.tone as Tone,
      coverUrl: n.coverUrl,
      subject: subById.get(n.subjectId)!,
      title: text?.title || "Sans titre",
      dek: text?.dek ?? "",
      locales: mine.filter((t) => t.title.trim()).map((t) => t.locale),
    };
  });
}

export async function studioCounts() {
  const rows = await db
    .select({ status: notes.status, n: sql<number>`count(*)::int` })
    .from(notes)
    .where(isNull(notes.deletedAt))
    .groupBy(notes.status);
  const by = Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<NoteStatus, number>>;
  const published = by.published ?? 0;
  const draft = by.draft ?? 0;
  const scheduled = by.scheduled ?? 0;
  return { all: published + draft + scheduled, published, draft, scheduled };
}

export async function studioNextScheduled() {
  const [row] = await db
    .select({ publishedAt: notes.publishedAt })
    .from(notes)
    .where(and(isNull(notes.deletedAt), eq(notes.status, "scheduled"), sql`${notes.publishedAt} > now()`))
    .orderBy(asc(notes.publishedAt))
    .limit(1);
  return row?.publishedAt ?? null;
}

export async function studioRecentNotes(limit = 5) {
  const rows = await db.select().from(notes).where(isNull(notes.deletedAt)).orderBy(desc(notes.updatedAt)).limit(limit);
  return decorate(rows);
}

export async function studioLastPublished() {
  const [row] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(isNull(notes.deletedAt), eq(notes.status, "published")))
    .orderBy(desc(notes.publishedAt))
    .limit(1);
  return row?.id ?? null;
}

export type SubjectWithCount = Subject & { count: number };

export async function studioSubjects(): Promise<SubjectWithCount[]> {
  const rows = await db
    .select({ subject: subjects, n: sql<number>`count(${notes.id})::int` })
    .from(subjects)
    .leftJoin(notes, and(eq(notes.subjectId, subjects.id), isNull(notes.deletedAt)))
    .groupBy(subjects.id)
    .orderBy(asc(subjects.position), asc(subjects.createdAt));
  return rows.map((r) => ({ ...r.subject, count: r.n }));
}

export type StudioNote = Note & { translations: Record<Locale, NoteTranslation | null> };

export async function studioGetNote(id: string): Promise<StudioNote | null> {
  const [note] = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  if (!note) return null;
  const texts = await db.select().from(noteTranslations).where(eq(noteTranslations.noteId, id));
  return {
    ...note,
    translations: {
      en: texts.find((t) => t.locale === "en") ?? null,
      fr: texts.find((t) => t.locale === "fr") ?? null,
    },
  };
}

export async function studioIdeas() {
  return db.select().from(ideas).orderBy(desc(ideas.createdAt));
}
