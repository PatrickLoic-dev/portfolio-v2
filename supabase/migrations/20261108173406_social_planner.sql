CREATE TYPE "public"."social_network" AS ENUM('linkedin', 'instagram', 'x');--> statement-breakpoint
CREATE TYPE "public"."social_status" AS ENUM('draft', 'scheduled', 'published');--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"networks" "social_network"[] DEFAULT '{}' NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"custom" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"link" text,
	"first_comment" text DEFAULT '' NOT NULL,
	"media" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "social_status" DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"published" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"note_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_posts_scheduled_idx" ON "social_posts" USING btree ("status","scheduled_at");