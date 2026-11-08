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
import { sql } from "drizzle-orm";
import { categories, categoryTone, posts } from "./seed/posts";
import { games as sampleGames, music } from "./seed/passions";
import { projects as seedProjects } from "./seed/projects";
import { games, notes, noteTranslations, projects, projectTranslations, settings, songs, subjects } from "../src/db/schema";
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

  /* Projects ------------------------------------------------------- */
  let newProjects = 0;
  for (const [i, p] of seedProjects.entries()) {
    const [row] = await db
      .insert(projects)
      .values({
        slug: p.slug,
        name: p.name,
        type: p.type,
        platform: p.mobile ? "mobile" : "web",
        status: "published",
        visible: true,
        featured: i < 5,
        position: i,
        client: p.client,
        liveUrl: p.url,
        tone: p.tone,
        tags: p.tags,
      })
      .onConflictDoNothing({ target: projects.slug })
      .returning({ id: projects.id });
    if (!row) continue;
    newProjects++;
    for (const locale of ["en", "fr"] as const) {
      const text = p.content[locale];
      const extra = p.extras?.[locale];
      await db.insert(projectTranslations).values({
        projectId: row.id,
        locale,
        description: text.description,
        sector: extra?.sector ?? "",
        problemTitle: extra?.headlines?.problem ?? "",
        problem: text.problem,
        approachTitle: extra?.headlines?.approach ?? "",
        approach: text.approach,
        outcomeTitle: extra?.headlines?.outcome ?? "",
        outcome: text.outcome,
      });
    }
  }
  console.log(`✓ ${newProjects} new projects`);

  /* Passions (sample data until the first Steam sync) --------------- */
  const [{ n: gameCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(games);
  if (gameCount === 0) {
    const steamGames = sampleGames.filter((g) => g.platform === "steam");
    const pin = [...steamGames].sort((a, b) => a.lastPlayedDaysAgo - b.lastPlayedDaysAgo)[0];
    await db.insert(games).values(
      steamGames.map((g) => ({
        name: g.name,
        playtime: g.hours * 60,
        achievementsTotal: 60,
        achievementsUnlocked: Math.round((g.pct / 100) * 60),
        lastPlayedAt: new Date(Date.now() - g.lastPlayedDaysAgo * 86400000),
        tone: g.tone,
        pinned: g === pin,
      })),
    );
    console.log(`✓ ${steamGames.length} sample Steam games`);
  }

  const [{ n: songCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(songs);
  if (songCount === 0) {
    await db.insert(songs).values({
      title: music.title,
      artist: music.artist,
      album: music.album,
      noteEn: music.note.en,
      noteFr: music.note.fr,
      mood: "focused",
      moodTextEn: music.mood.en.body,
      moodTextFr: music.mood.fr.body,
    });
    console.log("✓ placeholder song of the moment");
  }

  await db
    .insert(settings)
    .values([
      { key: "steam", value: { steamId: "", profileUrl: "", lastSyncAt: null, autoSync: true } },
      { key: "games", value: { minPct: 0 } },
      { key: "music", value: { spotifyProfile: "", appleProfile: "" } },
    ])
    .onConflictDoNothing({ target: settings.key });

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
