"use server";

import { site } from "@/content/site";
import { subscribeEmail } from "@/lib/newsletter";

export type FormState = { status: "idle" | "ok" | "error" };

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * Sends the contact form via Resend's HTTP API when RESEND_API_KEY is set.
 * Without a key (local dev) the message is logged so the flow stays testable.
 */
export async function sendContact(_: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const kind = String(formData.get("kind") ?? "").trim().slice(0, 100);
  const message = String(formData.get("message") ?? "").trim().slice(0, 5000);
  const honeypot = String(formData.get("company") ?? "");

  if (honeypot) return { status: "ok" }; // bot
  if (!name || !isEmail(email)) return { status: "error" };

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info("[contact] RESEND_API_KEY not set, message not emailed:", { name, email, kind, message });
    return { status: "ok" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM ?? "Portfolio <onboarding@resend.dev>",
      to: [site.email],
      reply_to: email,
      subject: `[Portfolio] ${kind} · ${name}`,
      text: `${name} <${email}>\n${kind}\n\n${message}`,
    }),
  });

  return { status: res.ok ? "ok" : "error" };
}

/** Newsletter sign-up: stores the address and emails a confirmation link (double opt-in). */
export async function subscribe(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const locale = formData.get("locale") === "fr" ? "fr" : "en";
  if (String(formData.get("company") ?? "")) return { status: "ok" }; // bot
  if (!isEmail(email)) return { status: "error" };
  try {
    await subscribeEmail(email, locale);
    return { status: "ok" };
  } catch (e) {
    console.error("[newsletter] subscribe", e);
    return { status: "error" };
  }
}
