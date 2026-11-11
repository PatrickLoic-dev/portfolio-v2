import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, testimonials } from "@/db/schema";
import type { Locale } from "@/i18n/routing";

/** A testimonial resolved to one language, as the public carousel shows it. */
export type PublicTestimonial = {
  id: string;
  name: string;
  initials: string;
  /** Tailwind background class for the initials badge. */
  tone: string;
  role: string;
  company: string;
  quote: string;
};

/** Literal class names so Tailwind generates them. */
const BADGE: Record<string, string> = {
  "blob-a": "bg-blob-a",
  "blob-b": "bg-blob-b",
  "blob-c": "bg-blob-c",
  secondary: "bg-secondary",
  muted: "bg-muted",
};

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .filter((_, i, all) => i === 0 || i === all.length - 1)
    .join("");

export async function getPublicTestimonials(locale: Locale): Promise<PublicTestimonial[]> {
  const rows = await db.select().from(testimonials).where(eq(testimonials.visible, true)).orderBy(asc(testimonials.position), asc(testimonials.createdAt));
  return rows
    .map((r) => ({
      id: r.id,
      name: r.name,
      initials: r.initials || initialsOf(r.name),
      tone: BADGE[r.tone] ?? BADGE["blob-b"],
      role: (locale === "fr" ? r.roleFr : r.roleEn) || r.roleEn || r.roleFr,
      company: r.company,
      quote: (locale === "fr" ? r.quoteFr : r.quoteEn) || r.quoteEn || r.quoteFr,
    }))
    .filter((t) => t.quote.trim());
}

export async function getPublicClients() {
  return db
    .select({ id: clients.id, name: clients.name, logoUrl: clients.logoUrl, url: clients.url })
    .from(clients)
    .where(eq(clients.visible, true))
    .orderBy(asc(clients.position), asc(clients.createdAt));
}

export async function studioTestimonials() {
  return db.select().from(testimonials).orderBy(asc(testimonials.position), asc(testimonials.createdAt));
}

export async function studioClients() {
  return db.select().from(clients).orderBy(asc(clients.position), asc(clients.createdAt));
}
