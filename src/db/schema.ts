import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/*
 * Studio — Blog schema.
 * RLS is enabled on every table with no policy: the public PostgREST API sees
 * nothing. The app reads and writes through Drizzle on the server, after
 * checking the admin session itself.
 */

export const noteStatus = pgEnum("note_status", ["draft", "published", "scheduled"]);
export const locale = pgEnum("locale", ["en", "fr"]);

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameFr: text("name_fr").notNull(),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionFr: text("description_fr").notNull().default(""),
  /** A design-system tone key (peach, leaf, sand…). */
  tone: text("tone").notNull().default("leaf"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    status: noteStatus("status").notNull().default("draft"),
    /** Publication date — in the future for scheduled notes. */
    publishedAt: timestamp("published_at", { withTimezone: true }),
    tone: text("tone").notNull().default("peach"),
    coverUrl: text("cover_url"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    featured: boolean("featured").notNull().default(false),
    /** Slug of a project in src/content/projects.ts. */
    relatedProject: text("related_project"),
    /** Soft delete — lets the editor offer "Restaurer la note". */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notes_status_published_idx").on(t.status, t.publishedAt)],
).enableRLS();

export const noteTranslations = pgTable(
  "note_translations",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    title: text("title").notNull().default(""),
    /** Chapeau — also the card excerpt. */
    dek: text("dek").notNull().default(""),
    /** Short display line on the cover; "\n" for line breaks. */
    hook: text("hook").notNull().default(""),
    /** Markdown. */
    body: text("body").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
  },
  (t) => [primaryKey({ columns: [t.noteId, t.locale] })],
).enableRLS();

/** "Idée rapide" on the dashboard. */
export const ideas = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export type Subject = typeof subjects.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type NoteTranslation = typeof noteTranslations.$inferSelect;
export type NoteStatus = (typeof noteStatus.enumValues)[number];
