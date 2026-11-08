import "server-only";
import { and, asc, desc, eq, gte, isNull, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { socialPosts, type SocialPost } from "@/db/schema";
import { pendingNetworks } from "./social";

export type PostView = Omit<SocialPost, "scheduledAt" | "createdAt" | "updatedAt" | "deletedAt"> & {
  scheduledAt: string | null;
  updatedAt: string;
  /** Scheduled, time passed, some network still waiting to be posted by hand. */
  due: boolean;
};

export function toView(p: SocialPost, now = Date.now()): PostView {
  const { deletedAt, createdAt, ...rest } = p;
  void deletedAt;
  void createdAt;
  return {
    ...rest,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    updatedAt: p.updatedAt.toISOString(),
    due: p.status === "scheduled" && !!p.scheduledAt && p.scheduledAt.getTime() <= now && pendingNetworks(p.networks, p.published).length > 0,
  };
}

const alive = isNull(socialPosts.deletedAt);

export async function allSocialPosts() {
  const rows = await db.select().from(socialPosts).where(alive).orderBy(desc(sql`coalesce(${socialPosts.scheduledAt}, ${socialPosts.updatedAt})`));
  const now = Date.now();
  return rows.map((r) => toView(r, now));
}

export async function socialPostsBetween(from: Date, to: Date) {
  const rows = await db
    .select()
    .from(socialPosts)
    .where(and(alive, gte(socialPosts.scheduledAt, from), lt(socialPosts.scheduledAt, to)))
    .orderBy(asc(socialPosts.scheduledAt));
  const now = Date.now();
  return rows.map((r) => toView(r, now));
}

export async function socialQueue() {
  const rows = await db.select().from(socialPosts).where(and(alive, eq(socialPosts.status, "draft"))).orderBy(desc(socialPosts.updatedAt));
  return rows.map((r) => toView(r));
}

export async function getSocialPost(id: string) {
  const [row] = await db.select().from(socialPosts).where(and(alive, eq(socialPosts.id, id))).limit(1);
  return row ? toView(row) : null;
}

/** Numbers for the sidebar, the dashboard and the overview. */
export async function socialCounts() {
  const now = new Date();
  const week = new Date(now.getTime() + 7 * 86400000);
  const [scheduled, drafts, dueRows, publishedMonth] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(socialPosts)
      .where(and(alive, eq(socialPosts.status, "scheduled"), gte(socialPosts.scheduledAt, now), lte(socialPosts.scheduledAt, week))),
    db.select({ n: sql<number>`count(*)::int` }).from(socialPosts).where(and(alive, eq(socialPosts.status, "draft"))),
    db.select().from(socialPosts).where(and(alive, eq(socialPosts.status, "scheduled"), lte(socialPosts.scheduledAt, now))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(socialPosts)
      .where(and(alive, eq(socialPosts.status, "published"), gte(socialPosts.updatedAt, new Date(now.getTime() - 30 * 86400000)))),
  ]);
  const [next] = await db
    .select({ at: socialPosts.scheduledAt })
    .from(socialPosts)
    .where(and(alive, eq(socialPosts.status, "scheduled"), gte(socialPosts.scheduledAt, now)))
    .orderBy(asc(socialPosts.scheduledAt))
    .limit(1);
  return {
    scheduledWeek: scheduled[0].n,
    drafts: drafts[0].n,
    due: dueRows.filter((p) => pendingNetworks(p.networks, p.published).length > 0).length,
    publishedMonth: publishedMonth[0].n,
    next: next?.at?.toISOString() ?? null,
  };
}

/** Scheduled posts in the next `days` days, soonest first. */
export async function upcomingSocialPosts(days = 7) {
  const now = new Date();
  return socialPostsBetween(now, new Date(now.getTime() + days * 86400000)).then((list) => list.filter((p) => p.status === "scheduled"));
}
