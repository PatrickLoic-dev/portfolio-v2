"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { clients, testimonials } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "./actions";

function refresh() {
  revalidatePath("/studio/testimonials");
  revalidatePath("/[locale]", "layout");
}

const BLOBS = ["blob-a", "blob-b", "blob-c", "secondary", "muted"] as const;

/* Testimonials --------------------------------------------------------- */

const testimonialInput = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "Indiquez le nom de la personne.").max(120),
  initials: z.string().trim().max(3),
  tone: z.enum(BLOBS),
  roleEn: z.string().trim().max(120),
  roleFr: z.string().trim().max(120),
  company: z.string().trim().max(120),
  quoteEn: z.string().trim().max(1200),
  quoteFr: z.string().trim().max(1200),
  visible: z.boolean(),
});
export type TestimonialInput = z.infer<typeof testimonialInput>;

export async function saveTestimonial(raw: TestimonialInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = testimonialInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const { id, ...values } = parsed.data;
  if (!values.quoteEn && !values.quoteFr) return { ok: false, error: "Ajoutez la citation, au moins dans une langue." };

  let rowId = id;
  if (rowId) {
    await db.update(testimonials).set(values).where(eq(testimonials.id, rowId));
  } else {
    const all = await db.select({ id: testimonials.id }).from(testimonials);
    const [row] = await db.insert(testimonials).values({ ...values, position: all.length }).returning({ id: testimonials.id });
    rowId = row.id;
  }
  refresh();
  return { ok: true, data: { id: rowId } };
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(testimonials).where(eq(testimonials.id, z.uuid().parse(id)));
  refresh();
  return { ok: true };
}

/* Clients -------------------------------------------------------------- */

const clientInput = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "Indiquez le nom de l'entreprise.").max(120),
  logoUrl: z.url().nullable(),
  url: z.url("Lien invalide (https://…).").nullable(),
  visible: z.boolean(),
});
export type ClientInput = z.infer<typeof clientInput>;

export async function saveClient(raw: ClientInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = clientInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const { id, ...values } = parsed.data;

  let rowId = id;
  if (rowId) {
    await db.update(clients).set(values).where(eq(clients.id, rowId));
  } else {
    const all = await db.select({ id: clients.id }).from(clients);
    const [row] = await db.insert(clients).values({ ...values, position: all.length }).returning({ id: clients.id });
    rowId = row.id;
  }
  refresh();
  return { ok: true, data: { id: rowId } };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(clients).where(eq(clients.id, z.uuid().parse(id)));
  refresh();
  return { ok: true };
}

/* Order (drag and drop) ------------------------------------------------- */

export async function reorderKindWords(kind: "testimonials" | "clients", ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const list = z.array(z.uuid()).max(200).parse(ids);
  const table = kind === "clients" ? clients : testimonials;
  await db.transaction(async (tx) => {
    const existing = await tx.select({ id: table.id }).from(table);
    const order = [...list.filter((id) => existing.some((e) => e.id === id)), ...existing.map((e) => e.id).filter((id) => !list.includes(id))];
    for (const [position, id] of order.entries()) await tx.update(table).set({ position }).where(eq(table.id, id));
  });
  refresh();
  return { ok: true };
}
