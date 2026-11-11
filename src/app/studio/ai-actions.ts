"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { AiError, aiEnabled, draftPosts, translateFields, type PostDrafts } from "@/lib/ai";
import { siteUrl } from "@/lib/newsletter";
import { getPreviewPost } from "@/lib/notes";
import type { ActionResult } from "./actions";

const translateInput = z.object({
  from: z.enum(["fr", "en"]),
  to: z.enum(["fr", "en"]),
  context: z.string().max(400),
  fields: z.record(z.string().max(40), z.string().max(100_000)),
});

export async function aiStatus(): Promise<boolean> {
  await requireAdmin();
  return aiEnabled();
}

export async function translate(raw: z.infer<typeof translateInput>): Promise<ActionResult<Record<string, string>>> {
  await requireAdmin();
  const input = translateInput.parse(raw);
  if (input.from === input.to) return { ok: false, error: "Choisissez deux langues différentes." };
  try {
    return { ok: true, data: await translateFields(input.from, input.to, input.fields, input.context) };
  } catch (e) {
    if (e instanceof AiError) return { ok: false, error: e.message };
    console.error("[ai] translate", e);
    return { ok: false, error: "La traduction a échoué. Réessayez." };
  }
}

/** Post drafts for every network from a blog note (in French or English). */
export async function draftSocialPostsFromNote(noteId: string, lang: "fr" | "en"): Promise<ActionResult<PostDrafts>> {
  await requireAdmin();
  const post = await getPreviewPost(z.uuid().parse(noteId), z.enum(["fr", "en"]).parse(lang));
  if (!post) return { ok: false, error: "Note introuvable." };
  if (!post.title.trim() && !post.body.trim()) return { ok: false, error: "Cette note n'a pas encore de texte." };
  try {
    const url = `${siteUrl()}${lang === "fr" ? "/fr" : ""}/blog/${post.slug}`;
    return { ok: true, data: await draftPosts({ title: post.title, dek: post.excerpt, body: post.body, url }, lang) };
  } catch (e) {
    if (e instanceof AiError) return { ok: false, error: e.message };
    console.error("[ai] draft", e);
    return { ok: false, error: "La génération a échoué. Réessayez." };
  }
}
