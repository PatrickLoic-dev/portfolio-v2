import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { revisions } from "@/db/schema";
import { noteToEditor, studioGetNote } from "./notes";
import { projectToEditor, studioGetProject } from "./portfolio";

export type RevisionEntity = "note" | "project";

/** Saves within this window update the latest version instead of adding one. */
const MERGE_MS = 10 * 60 * 1000;
/** Versions kept per note or project. */
const KEEP = 40;

async function snapshot(entity: RevisionEntity, id: string) {
  if (entity === "note") {
    const n = await studioGetNote(id);
    return n ? noteToEditor(n) : null;
  }
  const p = await studioGetProject(id);
  return p ? projectToEditor(p) : null;
}

const list = (entity: RevisionEntity, id: string) =>
  db
    .select({ id: revisions.id, label: revisions.label, updatedAt: revisions.updatedAt })
    .from(revisions)
    .where(and(eq(revisions.entity, entity), eq(revisions.entityId, id)))
    .orderBy(desc(revisions.updatedAt));

/**
 * Before a save: the first time a note/project is saved with history on,
 * keep its current state so the very first change can be undone too.
 */
export async function keepOrigin(entity: RevisionEntity, id: string | null) {
  if (!id) return;
  const [latest] = await list(entity, id).limit(1);
  if (latest) return;
  const snap = await snapshot(entity, id);
  if (snap) await db.insert(revisions).values({ entity, entityId: id, label: "Version d'origine", snapshot: snap });
}

/** After a save: record the saved state (merged with a recent version that has the same label). */
export async function recordRevision(entity: RevisionEntity, id: string, label: string) {
  const snap = await snapshot(entity, id);
  if (!snap) return;
  const all = await list(entity, id);
  const latest = all[0];
  const now = new Date();
  if (latest && latest.label === label && now.getTime() - latest.updatedAt.getTime() < MERGE_MS) {
    await db.update(revisions).set({ snapshot: snap, updatedAt: now }).where(eq(revisions.id, latest.id));
    return;
  }
  await db.insert(revisions).values({ entity, entityId: id, label, snapshot: snap });
  const extra = all.slice(KEEP - 1).map((r) => r.id);
  if (extra.length) await db.delete(revisions).where(inArray(revisions.id, extra));
}

export async function listRevisions(entity: RevisionEntity, id: string) {
  const rows = await db
    .select()
    .from(revisions)
    .where(and(eq(revisions.entity, entity), eq(revisions.entityId, id)))
    .orderBy(desc(revisions.updatedAt));
  return rows.map((r) => {
    const s = r.snapshot as { name?: string; translations: { fr: Record<string, string>; en: Record<string, string> } };
    const fr = s.translations.fr;
    const en = s.translations.en;
    const summary = s.name ?? (fr.title || en.title || "Sans titre");
    const words = Object.values({ ...fr }).join(" ").split(/\s+/).filter(Boolean).length + Object.values({ ...en }).join(" ").split(/\s+/).filter(Boolean).length;
    return { id: r.id, label: r.label, at: r.updatedAt.toISOString(), summary, words, snapshot: r.snapshot };
  });
}
