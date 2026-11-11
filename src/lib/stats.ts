import "server-only";
import { and, desc, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { notes, noteTranslations, pageViews, projects } from "@/db/schema";

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

const since = (days: number) => new Date(Date.now() - days * 86400000);

/** Totals for a window: views, daily-unique visitors (summed), mobile share. */
async function totals(from: Date, to = new Date()) {
  const [row] = await db
    .select({
      views: sql<number>`count(*)::int`,
      visitors: sql<number>`count(distinct (${pageViews.visitor}, date_trunc('day', ${pageViews.createdAt})))::int`,
      mobile: sql<number>`count(*) filter (where ${pageViews.device} = 'mobile')::int`,
    })
    .from(pageViews)
    .where(and(gte(pageViews.createdAt, from), lt(pageViews.createdAt, to)));
  return row;
}

export async function audience(days: Range) {
  const from = since(days);
  const where = gte(pageViews.createdAt, from);

  const [now, before, daily, pages, sources, locales] = await Promise.all([
    totals(from),
    totals(since(days * 2), from),
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${pageViews.createdAt}), 'YYYY-MM-DD')`,
        views: sql<number>`count(*)::int`,
        visitors: sql<number>`count(distinct ${pageViews.visitor})::int`,
      })
      .from(pageViews)
      .where(where)
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({ path: pageViews.path, views: sql<number>`count(*)::int`, visitors: sql<number>`count(distinct ${pageViews.visitor})::int` })
      .from(pageViews)
      .where(where)
      .groupBy(pageViews.path)
      .orderBy(desc(sql`2`))
      .limit(200),
    db
      .select({ host: pageViews.referrer, views: sql<number>`count(*)::int` })
      .from(pageViews)
      .where(and(where, isNotNull(pageViews.referrer)))
      .groupBy(pageViews.referrer)
      .orderBy(desc(sql`2`))
      .limit(10),
    db
      .select({ locale: pageViews.locale, views: sql<number>`count(*)::int` })
      .from(pageViews)
      .where(where)
      .groupBy(pageViews.locale),
  ]);

  // Every day of the window, zero-filled.
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const days_ = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10);
    return { day: d, views: byDay.get(d)?.views ?? 0, visitors: byDay.get(d)?.visitors ?? 0 };
  });

  // Names for blog notes and case studies.
  const slugOf = (prefix: string) => pages.filter((p) => p.path.startsWith(prefix)).map((p) => p.path.slice(prefix.length).split("/")[0]!);
  const noteSlugs = slugOf("/blog/");
  const projectSlugs = slugOf("/work/");
  const [noteTitles, projectNames] = await Promise.all([
    noteSlugs.length
      ? db
          .select({ slug: notes.slug, title: noteTranslations.title, locale: noteTranslations.locale })
          .from(notes)
          .innerJoin(noteTranslations, sql`${noteTranslations.noteId} = ${notes.id}`)
          .where(inArray(notes.slug, noteSlugs))
      : [],
    projectSlugs.length ? db.select({ slug: projects.slug, name: projects.name }).from(projects).where(inArray(projects.slug, projectSlugs)) : [],
  ]);
  const noteTitle = (slug: string) =>
    noteTitles.find((n) => n.slug === slug && n.locale === "fr" && n.title)?.title ?? noteTitles.find((n) => n.slug === slug && n.title)?.title ?? slug;

  const articles = pages
    .filter((p) => p.path.startsWith("/blog/"))
    .map((p) => ({ ...p, name: noteTitle(p.path.slice(6)) }))
    .slice(0, 8);
  const caseStudies = pages
    .filter((p) => p.path.startsWith("/work/"))
    .map((p) => ({ ...p, name: projectNames.find((x) => x.slug === p.path.slice(6))?.name ?? p.path.slice(6) }))
    .slice(0, 8);

  return {
    now,
    before,
    days: days_,
    pages: pages.slice(0, 10),
    articles,
    caseStudies,
    sources,
    direct: now.views - sources.reduce((n, s) => n + s.views, 0),
    locales,
  };
}

/** Dashboard card: visitors over the last 7 days and the week before. */
export async function weekVisitors() {
  const [now, before] = await Promise.all([totals(since(7)), totals(since(14), since(7))]);
  return { now: now.visitors, before: before.visitors };
}
