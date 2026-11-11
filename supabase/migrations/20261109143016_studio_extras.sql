CREATE TYPE "public"."revision_entity" AS ENUM('note', 'project');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('pending', 'active', 'unsubscribed');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"url" text,
	"visible" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "newsletter_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid,
	"subject" text NOT NULL,
	"recipients" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "newsletter_sends" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"referrer" text,
	"visitor" text NOT NULL,
	"device" text DEFAULT 'desktop' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "page_views" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "preview_links" (
	"token" text PRIMARY KEY NOT NULL,
	"entity" "revision_entity" NOT NULL,
	"entity_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "preview_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" "revision_entity" NOT NULL,
	"entity_id" uuid NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "revisions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"locale" "locale" DEFAULT 'en' NOT NULL,
	"status" "subscriber_status" DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "subscribers_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "subscribers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"initials" text DEFAULT '' NOT NULL,
	"tone" text DEFAULT 'blob-b' NOT NULL,
	"role_en" text DEFAULT '' NOT NULL,
	"role_fr" text DEFAULT '' NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"quote_en" text DEFAULT '' NOT NULL,
	"quote_fr" text DEFAULT '' NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "testimonials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "newsletter_sends" ADD CONSTRAINT "newsletter_sends_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_views_created_idx" ON "page_views" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "page_views_path_idx" ON "page_views" USING btree ("path");--> statement-breakpoint
CREATE INDEX "preview_links_entity_idx" ON "preview_links" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "revisions_entity_idx" ON "revisions" USING btree ("entity","entity_id","updated_at");--> statement-breakpoint
-- The two testimonials that used to live in src/content/site.ts.
INSERT INTO "testimonials" ("name","initials","tone","role_en","role_fr","company","quote_en","quote_fr","position") VALUES
('Leandre Thydian Mandessi Kwelle','LK','blob-b','Principal Architect & Co-founder','Architecte principal et co-fondateur','Asante Artsy',
 'Our work is about restraint, light and space, and Patrick understood that from the very first conversation. The site he built lets every project breathe: clients now discover our architecture the way we meant it to be seen.',
 'Notre travail parle de retenue, de lumière et d''espace, et Patrick l''a compris dès la première conversation. Le site qu''il a construit laisse respirer chaque projet : nos clients découvrent enfin notre architecture telle que nous voulions qu''elle soit vue.',0),
('Ignace Cabrel Elouga','IE','blob-a','Managing Partner','Associé gérant','Think Tech Solutions',
 'Patrick pairs a sharp technical eye with a real sense of product. He asks the right questions early, ships clean and reliable interfaces, and keeps everyone aligned. He''s exactly the partner you want on a project that matters.',
 'Patrick allie un vrai regard technique et un sens aigu du produit. Il pose les bonnes questions tôt, livre des interfaces propres et fiables, et garde tout le monde aligné. C''est exactement le partenaire qu''on veut sur un projet qui compte.',1);
--> statement-breakpoint
-- Client logos may be SVG.
UPDATE storage.buckets SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/avif','image/svg+xml'] WHERE id = 'covers';
