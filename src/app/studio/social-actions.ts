"use server";

import { and, eq, gte, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { socialPosts, type SocialNetwork, type SocialPublished } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/portfolio";
import { checks, NETWORK_KEYS, NETWORKS, nextSlot, pendingNetworks, type SocialSettings } from "@/lib/social";
import type { ActionResult } from "./actions";

const network = z.enum(NETWORK_KEYS as [SocialNetwork, ...SocialNetwork[]]);

function refresh() {
  revalidatePath("/studio", "layout");
}

const postInput = z.object({
  id: z.uuid().nullable(),
  networks: z.array(network).max(3),
  text: z.string().max(5000),
  custom: z.partialRecord(network, z.string().max(5000)),
  link: z.union([z.url({ message: "Lien invalide." }), z.literal("")]),
  firstComment: z.string().max(1000),
  media: z.array(z.url()).max(20),
  noteId: z.uuid().nullable(),
  /** draft · schedule (at) · queue (next free slot) · now (due immediately) */
  mode: z.enum(["draft", "schedule", "queue", "now"]),
  scheduledAt: z.iso.datetime({ offset: true }).nullable(),
});
export type SocialPostInput = z.infer<typeof postInput>;

async function takenSlots() {
  const rows = await db
    .select({ at: socialPosts.scheduledAt })
    .from(socialPosts)
    .where(and(isNull(socialPosts.deletedAt), eq(socialPosts.status, "scheduled"), gte(socialPosts.scheduledAt, new Date())));
  return rows.map((r) => r.at!.toISOString());
}

export async function saveSocialPost(raw: SocialPostInput): Promise<ActionResult<{ id: string; scheduledAt: string | null; status: string }>> {
  await requireAdmin();
  const parsed = postInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const p = parsed.data;

  if (p.mode !== "draft") {
    if (!p.networks.length) return { ok: false, error: "Sélectionnez au moins un réseau." };
    const blocking = checks({ ...p, link: p.link }).find((c) => c.level === "error");
    if (blocking) return { ok: false, error: `${NETWORKS[blocking.network].name} : ${blocking.message}` };
  }

  let scheduledAt: Date | null = null;
  if (p.mode === "schedule") {
    if (!p.scheduledAt) return { ok: false, error: "Choisissez une date et une heure." };
    scheduledAt = new Date(p.scheduledAt);
    if (scheduledAt <= new Date()) return { ok: false, error: "La date choisie est déjà passée." };
  }
  if (p.mode === "queue") {
    const { slots } = await getSetting("social");
    scheduledAt = new Date(nextSlot(p.networks, slots, new Date(), await takenSlots()));
  }
  if (p.mode === "now") scheduledAt = new Date();

  const values = {
    networks: p.networks,
    text: p.text,
    custom: Object.fromEntries(Object.entries(p.custom).filter(([n]) => p.networks.includes(n as SocialNetwork))),
    link: p.link || null,
    firstComment: p.firstComment,
    media: p.media,
    noteId: p.noteId,
    status: p.mode === "draft" ? ("draft" as const) : ("scheduled" as const),
    scheduledAt,
    updatedAt: new Date(),
  };

  let id = p.id;
  if (id) await db.update(socialPosts).set(values).where(eq(socialPosts.id, id));
  else [{ id }] = await db.insert(socialPosts).values(values).returning({ id: socialPosts.id });

  refresh();
  return { ok: true, data: { id: id!, scheduledAt: scheduledAt?.toISOString() ?? null, status: values.status } };
}

/** "Publié" for one network (after posting by hand). The post is done once every network is. */
export async function markPublished(id: string, net: SocialNetwork, url: string): Promise<ActionResult<{ done: boolean }>> {
  await requireAdmin();
  const postId = z.uuid().parse(id);
  const n = network.parse(net);
  const link = z.union([z.url({ message: "Lien de la publication invalide." }), z.literal("")]).safeParse(url.trim());
  if (!link.success) return { ok: false, error: link.error.issues[0].message };

  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
  if (!post) return { ok: false, error: "Publication introuvable." };
  const published: SocialPublished = { ...post.published, [n]: { at: new Date().toISOString(), ...(link.data ? { url: link.data } : {}) } };
  const done = pendingNetworks(post.networks, published).length === 0;
  await db
    .update(socialPosts)
    .set({ published, status: done ? "published" : post.status === "draft" ? "scheduled" : post.status, scheduledAt: post.scheduledAt ?? new Date(), updatedAt: new Date() })
    .where(eq(socialPosts.id, postId));
  refresh();
  return { ok: true, data: { done } };
}

export async function unschedule(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.update(socialPosts).set({ status: "draft", scheduledAt: null, updatedAt: new Date() }).where(eq(socialPosts.id, z.uuid().parse(id)));
  refresh();
  return { ok: true };
}

export async function shiftPost(id: string, days: number): Promise<ActionResult> {
  await requireAdmin();
  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, z.uuid().parse(id))).limit(1);
  if (!post?.scheduledAt) return { ok: false, error: "Cette publication n'est pas programmée." };
  const at = new Date(post.scheduledAt.getTime() + z.number().int().min(-30).max(30).parse(days) * 86400000);
  await db.update(socialPosts).set({ scheduledAt: at, updatedAt: new Date() }).where(eq(socialPosts.id, post.id));
  refresh();
  return { ok: true };
}

/** Queue → calendar: puts a draft on the next free suggested slot. */
export async function scheduleNext(id: string): Promise<ActionResult<{ at: string }>> {
  await requireAdmin();
  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, z.uuid().parse(id))).limit(1);
  if (!post) return { ok: false, error: "Publication introuvable." };
  if (!post.networks.length) return { ok: false, error: "Choisissez d'abord un réseau (Modifier)." };
  const blocking = checks({ ...post, link: post.link ?? "" }).find((c) => c.level === "error");
  if (blocking) return { ok: false, error: `À corriger avant de planifier : ${blocking.message}` };
  const { slots } = await getSetting("social");
  const at = nextSlot(post.networks, slots, new Date(), await takenSlots());
  await db.update(socialPosts).set({ status: "scheduled", scheduledAt: new Date(at), updatedAt: new Date() }).where(eq(socialPosts.id, post.id));
  refresh();
  return { ok: true, data: { at } };
}

export async function duplicatePost(id: string): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, z.uuid().parse(id))).limit(1);
  if (!post) return { ok: false, error: "Publication introuvable." };
  const [row] = await db
    .insert(socialPosts)
    .values({
      networks: post.networks,
      text: post.text,
      custom: post.custom,
      link: post.link,
      firstComment: post.firstComment,
      media: post.media,
      noteId: post.noteId,
      status: "draft",
    })
    .returning({ id: socialPosts.id });
  refresh();
  return { ok: true, data: { id: row.id } };
}

export async function deleteSocialPost(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.update(socialPosts).set({ deletedAt: new Date() }).where(eq(socialPosts.id, z.uuid().parse(id)));
  refresh();
  return { ok: true };
}

export async function restoreSocialPost(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.update(socialPosts).set({ deletedAt: null }).where(eq(socialPosts.id, z.uuid().parse(id)));
  refresh();
  return { ok: true };
}

const slot = z.object({ day: z.number().int().min(1).max(7), time: z.string().regex(/^\d{2}:\d{2}$/) });
const account = z.object({ handle: z.string().max(80), url: z.union([z.url({ message: "URL de profil invalide." }), z.literal("")]) });

export async function saveSocialSettings(raw: SocialSettings): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z
    .object({
      accounts: z.object({ linkedin: account, instagram: account, x: account }),
      slots: z.object({ linkedin: z.array(slot).max(14), instagram: z.array(slot).max(14), x: z.array(slot).max(14) }),
    })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await setSetting("social", parsed.data);
  refresh();
  return { ok: true };
}
