import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

/*
 * Claude in the Studio: EN↔FR translation and social post drafts.
 * Needs ANTHROPIC_API_KEY on the server; the Studio hides nothing without it,
 * the actions just answer with a clear message.
 */

const MODEL = "claude-opus-5-5";

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

export class AiError extends Error {}

/** One structured call: the reply is parsed against `schema`. */
async function ask<S extends z.ZodType>(system: string, prompt: string, schema: S, maxTokens = 16000): Promise<z.infer<S>> {
  if (!aiEnabled()) throw new AiError("Ajoutez ANTHROPIC_API_KEY aux variables d'environnement pour utiliser Claude.");
  try {
    const res = await anthropic().beta.messages.parse({
      model: MODEL,
      max_tokens: maxTokens,
      // A declined request is re-run on Anthropic's recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
      system,
      messages: [{ role: "user", content: prompt }],
    });
    if (res.stop_reason === "refusal") throw new AiError("Claude a refusé cette demande.");
    if (res.stop_reason === "max_tokens") throw new AiError("Texte trop long pour une seule passe : traduisez-le en plusieurs fois.");
    if (!res.parsed_output) throw new AiError("Réponse illisible, réessayez.");
    return res.parsed_output;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("Clé ANTHROPIC_API_KEY refusée.");
    if (e instanceof Anthropic.RateLimitError) throw new AiError("Trop de demandes à Claude, réessayez dans un instant.");
    if (e instanceof Anthropic.APIError) throw new AiError(`Claude est indisponible (${e.status ?? "réseau"}). Réessayez.`);
    throw e;
  }
}

const LANG = { fr: "French", en: "English" } as const;
export type Lang = keyof typeof LANG;

/**
 * Translates every field from one language to the other. Empty fields stay empty.
 * Markdown, code, links, product names and line breaks are kept as they are.
 */
export async function translateFields(from: Lang, to: Lang, fields: Record<string, string>, context: string): Promise<Record<string, string>> {
  const keys = Object.keys(fields).filter((k) => fields[k]?.trim());
  if (!keys.length) return {};
  const schema = z.object(Object.fromEntries(keys.map((k) => [k, z.string()])));
  const system = [
    `You translate content for Patrick Loic's portfolio (a front-end and mobile developer) from ${LANG[from]} to ${LANG[to]}.`,
    "Write as a native speaker would for this audience: natural, precise, same tone and register as the source. Keep the first person when the source uses it.",
    "Preserve Markdown structure exactly (headings, lists, links, emphasis, tables, code blocks and inline code untouched), line breaks, URLs, product and technology names, and numbers.",
    "French typography in French output: non-breaking space before : ; ! ? and guillemets « » for quotes. Never use the em dash character.",
    "Return every field you are given, translated, under the same key.",
  ].join("\n");
  const prompt = `Context: ${context}\n\nFields to translate (JSON):\n${JSON.stringify(Object.fromEntries(keys.map((k) => [k, fields[k]])), null, 2)}`;
  return ask(system, prompt, schema);
}

const draftSchema = z.object({
  linkedin: z.string().describe("LinkedIn post, 700 to 1300 characters"),
  x: z.string().describe("X post, at most 260 characters, the link is added separately"),
  instagram: z.string().describe("Instagram caption with 3 to 6 hashtags at the end"),
});
export type PostDrafts = z.infer<typeof draftSchema>;

/** Social post drafts for a blog note, one per network, in the requested language. */
export async function draftPosts(note: { title: string; dek: string; body: string; url: string }, lang: Lang): Promise<PostDrafts> {
  const system = [
    `You write social media posts in ${LANG[lang]} for Patrick Loic, a front-end and mobile developer who shares notes from his blog.`,
    "First person, warm and direct, no hype, no clichés, no emoji walls (one or two at most). Never use the em dash character.",
    "Open with a concrete hook taken from the note itself, give one or two real takeaways, end with an invitation to read the note.",
    "Do not include the link in the X post (it is attached separately). LinkedIn and Instagram may mention that the link is in the comments or bio.",
  ].join("\n");
  const prompt = `Note title: ${note.title}\nSummary: ${note.dek}\nLink: ${note.url}\n\nNote (Markdown):\n${note.body.slice(0, 40000)}`;
  return ask(system, prompt, draftSchema);
}
