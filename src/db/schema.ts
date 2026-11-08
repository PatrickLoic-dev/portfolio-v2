import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
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
    /** Slug of a project (projects.slug). */
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

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export const projectType = pgEnum("project_type", ["professional", "community", "personal"]);
export const projectPlatform = pgEnum("project_platform", ["web", "mobile"]);
export const projectStatus = pgEnum("project_status", ["draft", "published"]);

export type ProjectMetric = { value: string; labelEn: string; labelFr: string };

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    type: projectType("type").notNull().default("professional"),
    platform: projectPlatform("platform").notNull().default("web"),
    status: projectStatus("status").notNull().default("draft"),
    /** Shown on the Work page and the case study when true. */
    visible: boolean("visible").notNull().default(true),
    /** Home page "Selected work" (5 max, the first is the large card). */
    featured: boolean("featured").notNull().default(false),
    /** Order on Work (and among featured projects on Home). */
    position: integer("position").notNull().default(0),
    client: text("client"),
    role: text("role"),
    liveUrl: text("live_url"),
    /** Personal projects: public source code, and where it lives. */
    openSource: boolean("open_source").notNull().default(false),
    repoUrl: text("repo_url"),
    tone: text("tone").notNull().default("peach"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    /** Screenshots (Storage URLs). The first one replaces the stylised frame. */
    media: text("media").array().notNull().default(sql`'{}'::text[]`),
    metrics: jsonb("metrics").$type<ProjectMetric[]>().notNull().default([]),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_position_idx").on(t.position)],
).enableRLS();

export const projectTranslations = pgTable(
  "project_translations",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    /** Short description for cards (≤ 160 chars). */
    description: text("description").notNull().default(""),
    sector: text("sector").notNull().default(""),
    problemTitle: text("problem_title").notNull().default(""),
    problem: text("problem").notNull().default(""),
    approachTitle: text("approach_title").notNull().default(""),
    approach: text("approach").notNull().default(""),
    outcomeTitle: text("outcome_title").notNull().default(""),
    outcome: text("outcome").notNull().default(""),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.locale] })],
).enableRLS();

/* ------------------------------------------------------------------ */
/* Passions                                                            */
/* ------------------------------------------------------------------ */

/** Steam games (synced) — rows without an app id are sample data. */
export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  steamAppId: integer("steam_app_id").unique(),
  name: text("name").notNull(),
  /** Minutes played. */
  playtime: integer("playtime").notNull().default(0),
  achievementsUnlocked: integer("achievements_unlocked"),
  achievementsTotal: integer("achievements_total"),
  lastPlayedAt: timestamp("last_played_at", { withTimezone: true }),
  tone: text("tone").notNull().default("sand"),
  /**
   * Played through Steam Family Sharing: added by hand from a Store link.
   * The sync refreshes its achievements but never its name or hours.
   */
  family: boolean("family").notNull().default(false),
  visible: boolean("visible").notNull().default(true),
  /** "Currently playing" on the Passions page (one at a time). */
  pinned: boolean("pinned").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const musicProvider = pgEnum("music_provider", ["apple", "spotify", "other"]);

/** Each "Mettre à jour le site" adds a row; the latest one is live, older ones are the history. */
export const songs = pgTable("songs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  artist: text("artist").notNull().default(""),
  album: text("album").notNull().default(""),
  artworkUrl: text("artwork_url"),
  link: text("link"),
  provider: musicProvider("provider").notNull().default("other"),
  noteEn: text("note_en").notNull().default(""),
  noteFr: text("note_fr").notNull().default(""),
  mood: text("mood").notNull().default("focused"),
  moodTextEn: text("mood_text_en").notNull().default(""),
  moodTextFr: text("mood_text_fr").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/** Key/value settings (Steam account, music profiles, display options). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/* ------------------------------------------------------------------ */
/* Social planner                                                      */
/* ------------------------------------------------------------------ */

export const socialNetwork = pgEnum("social_network", ["linkedin", "instagram", "x"]);
export const socialStatus = pgEnum("social_status", ["draft", "scheduled", "published"]);

export type SocialNetwork = (typeof socialNetwork.enumValues)[number];
/** Per-network text override (missing = the common text). */
export type SocialCustomText = Partial<Record<SocialNetwork, string>>;
/** When (and where) each network actually went out. */
export type SocialPublished = Partial<Record<SocialNetwork, { at: string; url?: string }>>;

export const socialPosts = pgTable(
  "social_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    networks: socialNetwork("networks").array().notNull().default(sql`'{}'`),
    text: text("text").notNull().default(""),
    custom: jsonb("custom").$type<SocialCustomText>().notNull().default({}),
    link: text("link"),
    firstComment: text("first_comment").notNull().default(""),
    media: text("media").array().notNull().default(sql`'{}'::text[]`),
    status: socialStatus("status").notNull().default("draft"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    published: jsonb("published").$type<SocialPublished>().notNull().default({}),
    /** Blog note this post shares, if any. */
    noteId: uuid("note_id").references(() => notes.id, { onDelete: "set null" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("social_posts_scheduled_idx").on(t.status, t.scheduledAt)],
).enableRLS();

export type SocialPost = typeof socialPosts.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectTranslation = typeof projectTranslations.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Song = typeof songs.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type NoteTranslation = typeof noteTranslations.$inferSelect;
export type NoteStatus = (typeof noteStatus.enumValues)[number];
