/** Moods for "Musique & humeur" (Studio) and the Passions page. */
export const MOODS = {
  focused: { label: { en: "Focused", fr: "Concentré" }, hint: "Mode deep work", bg: "var(--blob-b)" },
  chill: { label: { en: "Chill", fr: "Détendu" }, hint: "Dimanche tranquille", bg: "var(--secondary)" },
  hyped: { label: { en: "Hyped", fr: "À fond" }, hint: "Énergie à fond", bg: "var(--blob-a)" },
  nostalgic: { label: { en: "Nostalgic", fr: "Nostalgique" }, hint: "Souvenirs", bg: "var(--blob-c)" },
  grinding: { label: { en: "Grinding", fr: "En session" }, hint: "Soirée ranked", bg: "var(--surface)" },
  creative: { label: { en: "Creative", fr: "Créatif" }, hint: "Nouvelles idées", bg: "var(--muted)" },
} as const;

export type Mood = keyof typeof MOODS;
export const MOOD_KEYS = Object.keys(MOODS) as Mood[];
