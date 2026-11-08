import type { Locale } from "../../src/i18n/routing";
import data from "./projects.data.json";

/** Background tones from the design system, used for project media panels. */
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

type ProjectText = {
  description: string;
  problem: string;
  approach: string;
  outcome: string;
};

/** Optional, richer case-study copy (headlines + highlight cards). */
type CaseStudyExtras = {
  sector?: string;
  headlines?: { problem: string; approach: string; outcome: string };
  highlights?: { label: string; value: string }[];
};

export type Project = {
  slug: string;
  n: string;
  name: string;
  type: "professional" | "community";
  tags: string[];
  tone: Tone;
  mobile: boolean;
  url: string | null;
  host: string;
  client: string | null;
  content: Record<Locale, ProjectText>;
  extras?: Partial<Record<Locale, CaseStudyExtras>>;
};

const extras: Record<string, Project["extras"]> = {
  "fly-banking": {
    en: {
      sector: "Fintech",
      headlines: {
        problem: "BICEC clients living abroad had no secure, practical way to manage their accounts from home.",
        approach: "A modular Angular frontend over idempotent NestJS calls.",
        outcome: "A production banking platform — and fewer support tickets.",
      },
      highlights: [
        { label: "Architecture", value: "Modular feature workspaces" },
        { label: "Safety", value: "Idempotent transfer calls" },
        { label: "Quality", value: "Typed services end-to-end" },
      ],
    },
    fr: {
      sector: "Fintech",
      headlines: {
        problem: "Les clients BICEC de la diaspora n'avaient aucun moyen sûr et pratique de gérer leurs comptes à distance.",
        approach: "Un frontend Angular modulaire sur des appels NestJS idempotents.",
        outcome: "Une plateforme bancaire en production — et moins de tickets support.",
      },
      highlights: [
        { label: "Architecture", value: "Espaces fonctionnels modulaires" },
        { label: "Sécurité", value: "Virements idempotents" },
        { label: "Qualité", value: "Services typés de bout en bout" },
      ],
    },
  },
  "click-cadyst": { en: { sector: "Retail" }, fr: { sector: "Distribution" } },
  "mon-panier": { en: { sector: "Marketplace" }, fr: { sector: "Marketplace" } },
  "asante-artsy": { en: { sector: "Architecture" }, fr: { sector: "Architecture" } },
  "jaec-agro": { en: { sector: "Agriculture" }, fr: { sector: "Agriculture" } },
  "ksa-glamour": { en: { sector: "Fashion" }, fr: { sector: "Mode" } },
  "tekken-mboa": { en: { sector: "Esports" }, fr: { sector: "Esport" } },
  "tekken-wavedash": { en: { sector: "Esports" }, fr: { sector: "Esport" } },
  "adele-shop": { en: { sector: "E-commerce" }, fr: { sector: "E-commerce" } },
};

export const projects: Project[] = (data as Omit<Project, "extras">[]).map((p) => ({
  ...p,
  extras: extras[p.slug],
}));

export const technologies = ["Angular", "Next.js", "NestJS", "Ionic", "Web Design", "E-commerce"];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function getNextProject(slug: string) {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}
