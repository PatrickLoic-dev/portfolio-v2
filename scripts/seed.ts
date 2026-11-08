/**
 * Seeds the Studio database from the original local content and creates the
 * admin account + the public "covers" storage bucket.
 *
 *   npm run db:seed          (idempotent: existing rows are left untouched)
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { categories, categoryTone, posts } from "./seed/posts";
import { notes, noteTranslations, subjects } from "../src/db/schema";
import en from "../messages/en.json";
import fr from "../messages/fr.json";

config({ path: ".env.local" });

const env = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} is not set in .env.local`);
  return v;
};

async function main() {
  const client = postgres(env("DATABASE_URL"), { max: 1 });
  const db = drizzle(client);

  /* Subjects ------------------------------------------------------- */
  for (const [i, key] of categories.entries()) {
    await db
      .insert(subjects)
      .values({
        slug: key,
        nameEn: en.blog.categories[key].label,
        nameFr: fr.blog.categories[key].label,
        descriptionEn: en.blog.categories[key].desc,
        descriptionFr: fr.blog.categories[key].desc,
        tone: categoryTone[key],
        position: i,
      })
      .onConflictDoNothing({ target: subjects.slug });
  }
  const subjectRows = await db.select().from(subjects);
  const subjectId = new Map(subjectRows.map((s) => [s.slug, s.id]));

  /* Notes ---------------------------------------------------------- */
  let created = 0;
  for (const p of posts) {
    const [row] = await db
      .insert(notes)
      .values({
        slug: p.slug,
        subjectId: subjectId.get(p.category)!,
        status: "published",
        publishedAt: new Date(`${p.date}T09:00:00+01:00`),
        tone: p.tone,
        tags: p.tags ?? [],
        featured: !!p.featured,
        relatedProject: p.relatedProject ?? null,
      })
      .onConflictDoNothing({ target: notes.slug })
      .returning({ id: notes.id });
    if (!row) continue; // already seeded
    created++;

    for (const locale of ["en", "fr"] as const) {
      const text = p.text[locale];
      const body = p.hasBody ? readFileSync(join(__dirname, "seed", `${p.slug}.${locale}.md`), "utf8").trim() : "";
      await db.insert(noteTranslations).values({
        noteId: row.id,
        locale,
        title: text.title,
        dek: text.excerpt,
        hook: text.hook,
        body,
      });
    }
  }
  console.log(`✓ ${subjectRows.length} subjects, ${created} new notes`);
  await client.end();

  /* Admin + storage ------------------------------------------------ */
  const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const email = env("ADMIN_EMAIL");
  const { data: list } = await supabase.auth.admin.listUsers();
  if (list?.users.some((u) => u.email?.toLowerCase() === email.toLowerCase())) {
    console.log(`✓ admin ${email} already exists`);
  } else {
    const { error } = await supabase.auth.admin.createUser({
      email,
      password: env("ADMIN_PASSWORD"),
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`✓ admin ${email} created (password: ADMIN_PASSWORD in .env.local)`);
  }

  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.id === "covers")) {
    const { error } = await supabase.storage.createBucket("covers", {
      public: true,
      fileSizeLimit: "5MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    });
    if (error) throw error;
    console.log("✓ storage bucket “covers” created");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
