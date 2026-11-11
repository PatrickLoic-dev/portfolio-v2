"use server";

import { z } from "zod";
import { db } from "@/db";
import { notes, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { activePreview, ensurePreview, revokePreviews } from "@/lib/preview";
import type { ActionResult } from "./actions";

const entityId = z.object({ entity: z.enum(["note", "project"]), id: z.uuid() });

export type PreviewLink = { path: string; expiresAt: string } | null;

async function pathFor(entity: "note" | "project", id: string, token: string) {
  const table = entity === "note" ? notes : projects;
  const [row] = await db.select({ slug: table.slug }).from(table).where(eq(table.id, id)).limit(1);
  if (!row) return null;
  return `/${entity === "note" ? "blog" : "work"}/${row.slug}?preview=${token}`;
}

export async function getPreviewLink(entity: "note" | "project", id: string): Promise<PreviewLink> {
  await requireAdmin();
  const input = entityId.parse({ entity, id });
  const link = await activePreview(input.entity, input.id);
  if (!link) return null;
  const path = await pathFor(input.entity, input.id, link.token);
  return path ? { path, expiresAt: link.expiresAt.toISOString() } : null;
}

export async function createPreviewLink(entity: "note" | "project", id: string): Promise<ActionResult<NonNullable<PreviewLink>>> {
  await requireAdmin();
  const input = entityId.parse({ entity, id });
  const link = await ensurePreview(input.entity, input.id);
  const path = await pathFor(input.entity, input.id, link.token);
  if (!path) return { ok: false, error: "Enregistrez d'abord." };
  return { ok: true, data: { path, expiresAt: link.expiresAt.toISOString() } };
}

export async function revokePreviewLink(entity: "note" | "project", id: string): Promise<ActionResult> {
  await requireAdmin();
  const input = entityId.parse({ entity, id });
  await revokePreviews(input.entity, input.id);
  return { ok: true };
}
