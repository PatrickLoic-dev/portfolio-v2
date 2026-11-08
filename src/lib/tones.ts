/** Background tones from the design system (project media, note covers, subjects, games). */
export const tones = {
  peach: { bg: "var(--blob-a)", ink: "var(--foreground)" },
  leaf: { bg: "var(--blob-b)", ink: "var(--foreground)" },
  sand: { bg: "var(--blob-c)", ink: "var(--foreground)" },
  sage: { bg: "var(--secondary)", ink: "var(--foreground)" },
  terracotta: { bg: "var(--accent)", ink: "var(--foreground)" },
  muted: { bg: "var(--muted)", ink: "var(--foreground)" },
  surface: { bg: "var(--surface)", ink: "var(--foreground)" },
  ink: { bg: "var(--foreground)", ink: "var(--background)" },
} as const;

export type Tone = keyof typeof tones;

export const TONE_KEYS = Object.keys(tones) as Tone[];

export const toneOf = (key: string | null | undefined) => tones[(key ?? "") as Tone] ?? tones.peach;
