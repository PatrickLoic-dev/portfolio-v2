import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { previewLinks } from "@/db/schema";

export type PreviewEntity = "note" | "project";

/** How long a shared draft link stays valid. */
export const PREVIEW_DAYS = 14;

/** The live link for a note/project, if any. */
export async function activePreview(entity: PreviewEntity, id: string) {
  const [row] = await db
    .select()
    .from(previewLinks)
    .where(and(eq(previewLinks.entity, entity), eq(previewLinks.entityId, id), gt(previewLinks.expiresAt, new Date())))
    .orderBy(desc(previewLinks.expiresAt))
    .limit(1);
  return row ?? null;
}

/** Returns the live link, or creates one. */
export async function ensurePreview(entity: PreviewEntity, id: string) {
  const existing = await activePreview(entity, id);
  if (existing) return existing;
  const [row] = await db
    .insert(previewLinks)
    .values({ token: randomBytes(18).toString("base64url"), entity, entityId: id, expiresAt: new Date(Date.now() + PREVIEW_DAYS * 86400000) })
    .returning();
  return row;
}

export async function revokePreviews(entity: PreviewEntity, id: string) {
  await db.delete(previewLinks).where(and(eq(previewLinks.entity, entity), eq(previewLinks.entityId, id)));
}

/** The note/project id a token opens, when the token is valid for that kind. */
export async function resolvePreview(token: string | string[] | undefined, entity: PreviewEntity) {
  if (typeof token !== "string" || !/^[\w-]{20,40}$/.test(token)) return null;
  const [row] = await db
    .select({ entityId: previewLinks.entityId })
    .from(previewLinks)
    .where(and(eq(previewLinks.token, token), eq(previewLinks.entity, entity), gt(previewLinks.expiresAt, new Date())))
    .limit(1);
  return row?.entityId ?? null;
}
