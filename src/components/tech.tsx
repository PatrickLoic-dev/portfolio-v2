import { Database, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { BrandIcon, brandColor, type Brand } from "@/components/brand-icon";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Technologies shown as their logo, with the name in a tooltip.       */
/* ------------------------------------------------------------------ */

type Tech = { label: string; brand?: Brand; icon?: LucideIcon; color: string };

const brand = (label: string, b: Brand): Tech => ({ label, brand: b, color: brandColor(b) });

/** Keyed by a normalised name ("Next.js", "nextjs" and "next js" all match). */
const TECHS: Record<string, Tech> = {
  javascript: brand("JavaScript", "javascript"),
  typescript: brand("TypeScript", "typescript"),
  // simple-icons lists Angular's new near-black mark; the red reads better on hover.
  angular: { ...brand("Angular", "angular"), color: "#DD0031" },
  react: brand("React", "react"),
  reactnative: brand("React Native", "react"),
  nextjs: brand("Next.js", "nextdotjs"),
  redux: brand("Redux", "redux"),
  stencil: brand("Stencil", "stencil"),
  ionic: brand("Ionic", "ionic"),
  tailwindcss: brand("Tailwind CSS", "tailwindcss"),
  tailwind: brand("Tailwind CSS", "tailwindcss"),
  sass: brand("Sass", "sass"),
  scss: brand("Sass", "sass"),
  nestjs: brand("NestJS", "nestjs"),
  nodejs: brand("Node.js", "nodedotjs"),
  node: brand("Node.js", "nodedotjs"),
  postgresql: brand("PostgreSQL", "postgresql"),
  postgres: brand("PostgreSQL", "postgresql"),
  mongodb: brand("MongoDB", "mongodb"),
  mysql: brand("MySQL", "mysql"),
  sql: { label: "SQL", icon: Database, color: "var(--accent-ink)" },
  docker: brand("Docker", "docker"),
  git: brand("Git", "git"),
  notion: brand("Notion", "notion"),
};

const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/** The known technology behind a tag, or null for plain tags ("E-commerce"). */
export function techOf(name: string): Tech | null {
  return TECHS[key(name)] ?? null;
}

/** Just the glyph, in ink; the brand colour comes on hover via `--tech`. */
export function TechGlyph({ name, size = 16 }: { name: string; size?: number }) {
  const t = techOf(name);
  if (!t) return null;
  if (t.brand) return <BrandIcon brand={t.brand} size={size} className="tech-glyph" />;
  const Icon = t.icon!;
  return <Icon size={size} strokeWidth={2} className="tech-glyph" aria-hidden />;
}

/**
 * A technology as a round logo chip with a tooltip.
 * - `focusable`: lets keyboard users reach the tooltip. Leave it off inside
 *   links and buttons (no nested interactive elements); the name stays in
 *   the accessible text either way.
 * Unknown names fall back to the usual text chip.
 */
export function TechChip({ name, focusable = false, size = 16, className }: { name: string; focusable?: boolean; size?: number; className?: string }) {
  const t = techOf(name);
  if (!t) return <span className={cn("chip", className)}>{name}</span>;
  return (
    <span
      className={cn("tech chip tech-chip", className)}
      style={{ "--tech": t.color } as CSSProperties}
      tabIndex={focusable ? 0 : undefined}
      role={focusable ? "img" : undefined}
      aria-label={focusable ? t.label : undefined}
    >
      <TechGlyph name={name} size={size} />
      {!focusable && <span className="sr-only">{t.label}</span>}
      <span className="tech-tip" aria-hidden>
        {t.label}
      </span>
    </span>
  );
}

/** A row of technologies (known ones as logos, the rest as text chips). */
export function TechList({ names, focusable = false, className }: { names: readonly string[]; focusable?: boolean; className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {names.map((n) => (
        <TechChip key={n} name={n} focusable={focusable} />
      ))}
    </span>
  );
}

/** Every known technology name once, in display form (for autocompletion). */
export const TECH_LABELS: string[] = [...new Set(Object.values(TECHS).map((t) => t.label))];

/** The display form of a tag: "nextjs" → "Next.js"; unknown tags are just trimmed. */
export function canonicalTag(name: string): string {
  return techOf(name)?.label ?? name.trim().replace(/\s+/g, " ");
}

/** Same tag, whatever the case or punctuation ("Next.js" = "nextjs"). */
export function sameTag(a: string, b: string): boolean {
  return key(a) === key(b);
}
