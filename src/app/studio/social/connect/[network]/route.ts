import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { API_NETWORKS, apiConfigured, authorizeUrl, type ApiNetwork } from "@/lib/social-api";

/** Starts the OAuth flow: remembers state (and the PKCE verifier) in a short-lived cookie. */
export async function GET(req: NextRequest, { params }: RouteContext<"/studio/social/connect/[network]">) {
  await requireAdmin();
  const { network } = await params;
  if (!API_NETWORKS.includes(network as ApiNetwork)) return NextResponse.json({ error: "unknown network" }, { status: 404 });
  if (!apiConfigured(network as ApiNetwork)) {
    const back = req.nextUrl.clone();
    back.pathname = "/studio/social/accounts";
    back.search = "?connexion=erreur";
    return NextResponse.redirect(back);
  }
  const { url, state, verifier } = authorizeUrl(network as ApiNetwork, req.nextUrl.origin);
  const res = NextResponse.redirect(url);
  res.cookies.set("social_oauth", JSON.stringify({ network, state, verifier }), {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/studio/social",
    maxAge: 600,
  });
  return res;
}
