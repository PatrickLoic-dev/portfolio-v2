"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { sendNote } from "@/lib/newsletter";
import type { ActionResult } from "./actions";

export async function sendNoteToSubscribers(noteId: string): Promise<ActionResult<{ recipients: number }>> {
  await requireAdmin();
  try {
    const recipients = await sendNote(z.uuid().parse(noteId));
    revalidatePath("/studio", "layout");
    return { ok: true, data: { recipients } };
  } catch (e) {
    console.error("[newsletter] send", e);
    return { ok: false, error: e instanceof Error && !e.message.startsWith("Resend") ? e.message : "L'envoi a échoué. Vérifiez la configuration Resend." };
  }
}

/** Removes an address for good (on request, or to clean up). */
export async function deleteSubscriber(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(subscribers).where(eq(subscribers.id, z.uuid().parse(id)));
  revalidatePath("/studio", "layout");
  return { ok: true };
}
