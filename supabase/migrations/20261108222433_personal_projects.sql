ALTER TYPE "public"."project_type" ADD VALUE 'personal';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "open_source" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "repo_url" text;