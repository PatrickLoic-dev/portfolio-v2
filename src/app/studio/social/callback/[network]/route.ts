import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { API_NETWORKS, completeAuth, SocialApiError, type ApiNetwork } from "@/lib/social-api";

/** OAuth return: checks the state, stores the tokens, back to Comptes with a status. */
export async function GET(req: NextRequest, { params }: RouteContext<"/studio/social/callback/[network]">) {
  await requireAdmin();
  const { network } = await params;
  const back = (status: string) => {
    const url = req.nextUrl.clone();
    url.pathname = "/studio/social/accounts";
    url.search = `?connexion=${status}&reseau=${network}`;
    const res = NextResponse.redirect(url);
    res.cookies.delete({ name: "social_oauth", path: "/studio/social" });
    return res;
  };

  let saved: { network?: string; state?: string; verifier?: string } = {};
  try {
    saved = JSON.parse(req.cookies.get("social_oauth")?.value ?? "{}");
  } catch {}
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!API_NETWORKS.includes(network as ApiNetwork) || saved.network !== network || !state || state !== saved.state) return back("invalide");
  if (!code) return back("annulee");

  try {
    await completeAuth(network as ApiNetwork, code, saved.verifier ?? "", req.nextUrl.origin);
    return back("ok");
  } catch (e) {
    if (!(e instanceof SocialApiError)) console.error("[social-api] callback", e);
    return back("erreur");
  }
}
