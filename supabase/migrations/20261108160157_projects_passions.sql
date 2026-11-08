CREATE TYPE "public"."music_provider" AS ENUM('apple', 'spotify', 'other');--> statement-breakpoint
CREATE TYPE "public"."project_platform" AS ENUM('web', 'mobile');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('professional', 'community');--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"steam_app_id" integer,
	"name" text NOT NULL,
	"playtime" integer DEFAULT 0 NOT NULL,
	"achievements_unlocked" integer,
	"achievements_total" integer,
	"last_played_at" timestamp with time zone,
	"tone" text DEFAULT 'sand' NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_steam_app_id_unique" UNIQUE("steam_app_id")
);
--> statement-breakpoint
ALTER TABLE "games" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_translations" (
	"project_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sector" text DEFAULT '' NOT NULL,
	"problem_title" text DEFAULT '' NOT NULL,
	"problem" text DEFAULT '' NOT NULL,
	"approach_title" text DEFAULT '' NOT NULL,
	"approach" text DEFAULT '' NOT NULL,
	"outcome_title" text DEFAULT '' NOT NULL,
	"outcome" text DEFAULT '' NOT NULL,
	CONSTRAINT "project_translations_project_id_locale_pk" PRIMARY KEY("project_id","locale")
);
--> statement-breakpoint
ALTER TABLE "project_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"type" "project_type" DEFAULT 'professional' NOT NULL,
	"platform" "project_platform" DEFAULT 'web' NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"client" text,
	"role" text,
	"live_url" text,
	"tone" text DEFAULT 'peach' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"media" text[] DEFAULT '{}'::text[] NOT NULL,
	"metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"artist" text DEFAULT '' NOT NULL,
	"album" text DEFAULT '' NOT NULL,
	"artwork_url" text,
	"link" text,
	"provider" "music_provider" DEFAULT 'other' NOT NULL,
	"note_en" text DEFAULT '' NOT NULL,
	"note_fr" text DEFAULT '' NOT NULL,
	"mood" text DEFAULT 'focused' NOT NULL,
	"mood_text_en" text DEFAULT '' NOT NULL,
	"mood_text_fr" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "songs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_translations" ADD CONSTRAINT "project_translations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_position_idx" ON "projects" USING btree ("position");