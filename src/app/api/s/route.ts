import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { pageViews } from "@/db/schema";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor|curl|wget|python|go-http/i;

const body = z.object({
  path: z.string().max(300).startsWith("/"),
  locale: z.enum(["en", "fr"]),
  referrer: z.string().max(500).optional(),
});

/**
 * Page view beacon (see components/site/analytics.tsx). Short neutral path on purpose: blockers filter "/track".
 * No cookie, no IP stored: a visitor is a hash of IP + browser + day + a server secret,
 * so the same person counts once a day and can't be followed across days.
 */
export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });
  // The admin's own visits (signed in to the Studio) don't count.
  if (req.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"))) return new NextResponse(null, { status: 204 });

  let data: z.infer<typeof body>;
  try {
    data = body.parse(JSON.parse(await req.text()));
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  const salt = process.env.ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "salt";
  const day = new Date().toISOString().slice(0, 10);
  const visitor = createHash("sha256").update(`${salt}|${day}|${ip}|${ua}`).digest("base64url").slice(0, 22);

  let referrer: string | null = null;
  if (data.referrer) {
    try {
      const host = new URL(data.referrer).host.replace(/^www\./, "");
      if (host && host !== req.nextUrl.host.replace(/^www\./, "")) referrer = host;
    } catch {}
  }

  // Normalise: /fr/blog/x → /blog/x (the locale has its own column).
  const path = data.path.replace(/^\/fr(?=\/|$)/, "") || "/";

  await db.insert(pageViews).values({
    path: path.split("?")[0]!.split("#")[0]!.slice(0, 200) || "/",
    locale: data.locale,
    referrer,
    visitor,
    device: /mobi|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop",
  });
  return new NextResponse(null, { status: 204 });
}
