import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSends, subscribers } from "@/db/schema";
import { site } from "@/content/site";
import type { Locale } from "@/i18n/routing";
import { getPreviewPost } from "./notes";

/*
 * Newsletter: double opt-in subscriptions and "send this note", through Resend.
 * Sending needs RESEND_API_KEY *and* a sender on a domain verified in Resend: the test
 * sender (onboarding@resend.dev) only reaches the Resend account owner. Until then emails
 * are logged and sign-ups are kept as confirmed (single opt-in), ready for the first send.
 */

const from = () => process.env.NEWSLETTER_FROM ?? process.env.CONTACT_FROM ?? "Patrick Loic <onboarding@resend.dev>";

/** True when newsletter emails can actually reach subscribers. */
export const mailEnabled = () => !!process.env.RESEND_API_KEY && !/@resend\.dev>?\s*$/i.test(from());

/** Absolute site address for links in emails. */
export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.NODE_ENV !== "production") return "http://localhost:3100";
  return site.url;
}

const localePath = (locale: Locale, path: string) => `${siteUrl()}${locale === "fr" ? "/fr" : ""}${path}`;
type Mail = { to: string; subject: string; html: string; text: string; headers?: Record<string, string> };

async function resend(path: "/emails" | "/emails/batch", body: unknown) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function sendOne(mail: Mail) {
  if (!mailEnabled()) return console.info("[newsletter] no verified sender, email not sent:", mail.to, mail.subject);
  await resend("/emails", { from: from(), to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text, headers: mail.headers });
}

/** Resend accepts 100 emails per batch call. */
async function sendMany(mails: Mail[]) {
  if (!mailEnabled()) return console.info(`[newsletter] no verified sender, ${mails.length} emails not sent`);
  for (let i = 0; i < mails.length; i += 100) {
    await resend(
      "/emails/batch",
      mails.slice(i, i + 100).map((m) => ({ from: from(), to: [m.to], subject: m.subject, html: m.html, text: m.text, headers: m.headers })),
    );
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** One simple, readable layout in the site's colours. */
function layout(inner: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#faf4ec;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#251e19">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#fdf8f1;border-radius:20px;border:1px solid #eadfd0" cellpadding="0" cellspacing="0"><tr><td style="padding:36px 32px">
<p style="margin:0 0 28px;font-size:18px;font-weight:800;letter-spacing:-0.02em">Patrick Loic<span style="color:#c46949">.</span></p>
${inner}
</td></tr></table>
<p style="max-width:560px;margin:20px auto 0;font-size:12px;line-height:1.6;color:#6f6359">${footer}</p>
</td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#251e19;color:#fdf8f1;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:999px">${esc(label)}</a>`;

const COPY = {
  en: {
    confirmSubject: "Confirm your subscription",
    confirmBody: "Thanks for subscribing to my notes. One click to confirm it's really you:",
    confirmCta: "Confirm my subscription",
    confirmIgnore: "Didn't ask for this? Just ignore this email, nothing will be sent.",
    read: "Read the note",
    footer: "You get this email because you subscribed to Patrick Loic's notes.",
    unsubscribe: "Unsubscribe",
  },
  fr: {
    confirmSubject: "Confirmez votre abonnement",
    confirmBody: "Merci de vous abonner à mes notes. Un clic pour confirmer que c'est bien vous :",
    confirmCta: "Confirmer mon abonnement",
    confirmIgnore: "Vous n'avez rien demandé ? Ignorez simplement cet email, rien ne vous sera envoyé.",
    read: "Lire la note",
    footer: "Vous recevez cet email car vous êtes abonné·e aux notes de Patrick Loic.",
    unsubscribe: "Se désinscrire",
  },
} as const;

const unsubscribeUrl = (token: string) => `${siteUrl()}/api/newsletter/unsubscribe?token=${token}`;

/* Subscriptions --------------------------------------------------------- */

export async function subscribeEmail(email: string, locale: Locale) {
  const address = email.trim().toLowerCase();
  const [existing] = await db.select().from(subscribers).where(eq(subscribers.email, address)).limit(1);
  if (existing?.status === "active") return;

  const token = existing?.token ?? randomBytes(24).toString("base64url");
  if (existing) await db.update(subscribers).set({ status: "pending", locale }).where(eq(subscribers.id, existing.id));
  else await db.insert(subscribers).values({ email: address, locale, token });

  if (!mailEnabled()) {
    // No verified sender yet: nothing to click, so keep the address as confirmed.
    await db.update(subscribers).set({ status: "active", confirmedAt: new Date() }).where(eq(subscribers.email, address));
    return console.info("[newsletter] no verified sender, subscription confirmed without email:", address);
  }

  const c = COPY[locale];
  const confirm = `${siteUrl()}/api/newsletter/confirm?token=${token}`;
  await sendOne({
    to: address,
    subject: c.confirmSubject,
    text: `${c.confirmBody}\n${confirm}\n\n${c.confirmIgnore}`,
    html: layout(
      `<p style="margin:0 0 24px;font-size:17px;line-height:1.6">${esc(c.confirmBody)}</p>${button(confirm, c.confirmCta)}<p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#6f6359">${esc(c.confirmIgnore)}</p>`,
      esc(c.footer),
    ),
  });
}

export async function confirmSubscriber(token: string) {
  const [row] = await db
    .update(subscribers)
    .set({ status: "active", confirmedAt: new Date() })
    .where(and(eq(subscribers.token, token)))
    .returning({ locale: subscribers.locale });
  return row?.locale ?? null;
}

export async function unsubscribe(token: string) {
  const [row] = await db.update(subscribers).set({ status: "unsubscribed" }).where(eq(subscribers.token, token)).returning({ locale: subscribers.locale });
  return row?.locale ?? null;
}

/* Studio ----------------------------------------------------------------- */

export async function subscriberCounts() {
  const rows = await db.select({ status: subscribers.status, n: sql<number>`count(*)::int` }).from(subscribers).groupBy(subscribers.status);
  const by = Object.fromEntries(rows.map((r) => [r.status, r.n]));
  return { active: by.active ?? 0, pending: by.pending ?? 0, unsubscribed: by.unsubscribed ?? 0 };
}

export async function studioSubscribers() {
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
}

export async function studioSends() {
  return db.select().from(newsletterSends).orderBy(desc(newsletterSends.sentAt));
}

/** Emails a published note to every active subscriber, in their language. */
export async function sendNote(noteId: string) {
  const active = await db.select().from(subscribers).where(eq(subscribers.status, "active"));
  if (!active.length) throw new Error("Aucun abonné confirmé pour l'instant.");

  const posts = { en: await getPreviewPost(noteId, "en"), fr: await getPreviewPost(noteId, "fr") };
  if (!posts.en || !posts.fr) throw new Error("Note introuvable.");

  const mails: Mail[] = active.map((s) => {
    const post = posts[s.locale];
    const c = COPY[s.locale];
    const url = localePath(s.locale, `/blog/${post.slug}`);
    const unsub = unsubscribeUrl(s.token);
    return {
      to: s.email,
      subject: post.title,
      headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      text: `${post.title}\n\n${post.excerpt}\n\n${c.read}: ${url}\n\n${c.footer}\n${c.unsubscribe}: ${unsub}`,
      html: layout(
        `${post.coverUrl ? `<img src="${post.coverUrl}" alt="" width="496" style="display:block;width:100%;height:auto;border-radius:14px;margin:0 0 24px">` : ""}
<p style="margin:0 0 10px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9c4a2c">${esc(post.subject.label)}</p>
<h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;letter-spacing:-0.03em">${esc(post.title)}</h1>
<p style="margin:0 0 28px;font-size:17px;line-height:1.6;color:#4d433b">${esc(post.excerpt)}</p>
${button(url, c.read)}`,
        `${esc(c.footer)} <a href="${unsub}" style="color:#6f6359">${esc(c.unsubscribe)}</a>`,
      ),
    };
  });

  await sendMany(mails);
  await db.insert(newsletterSends).values({ noteId, subject: posts.fr.title || posts.en.title, recipients: mails.length });
  return mails.length;
}
