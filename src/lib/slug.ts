/** "Éditer une Note !" → "editer-une-note" */
export function slugify(text: string, max = 80) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, max)
    .replace(/-$/, "");
}

/** Reading time at ~200 words per minute, at least one minute. */
export function readingMinutes(markdown: string) {
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

export function wordCount(markdown: string) {
  return markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
}

/** "## Title" lines → table of contents entries with the ids the renderer gives them. */
export function extractToc(markdown: string) {
  const seen = new Map<string, number>();
  const out: { id: string; label: string }[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (line.trim().startsWith("```")) inFence = !inFence;
    if (inFence) continue;
    const m = /^##\s+(.+?)\s*#*$/.exec(line);
    if (!m) continue;
    const label = m[1].replace(/[*_`]/g, "");
    out.push({ id: headingId(label, seen), label });
  }
  return out;
}

/** Stable, de-duplicated heading id (shared by the TOC and the renderer). */
export function headingId(label: string, seen: Map<string, number>) {
  const base = slugify(label) || "section";
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return n ? `${base}-${n}` : base;
}
