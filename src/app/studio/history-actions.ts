"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { listRevisions } from "@/lib/revisions";

export type HistoryEntry = { id: string; label: string; at: string; summary: string; words: number; snapshot: unknown };

/** Saved versions of a note or a project, newest first. */
export async function getHistory(entity: "note" | "project", id: string): Promise<HistoryEntry[]> {
  await requireAdmin();
  return listRevisions(z.enum(["note", "project"]).parse(entity), z.uuid().parse(id));
}
