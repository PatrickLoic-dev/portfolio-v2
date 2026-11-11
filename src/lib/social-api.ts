import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

/*
 * Direct publishing to LinkedIn and X through their official APIs (OAuth 2).
 * Each network needs a developer app; its keys live in env variables:
 *   LinkedIn: LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET (product "Share on LinkedIn")
 *   X:        X_CLIENT_ID / X_CLIENT_SECRET (OAuth 2.0, read and write)
 * Tokens are kept in the settings table (RLS on, never sent to the browser).
 */

export type ApiNetwork = "linkedin" | "x";
export const API_NETWORKS: ApiNetwork[] = ["linkedin", "x"];

type Token = {
  accessToken: string;
  refreshToken?: string;
  /** ISO date. */
  expiresAt: string;
  /** LinkedIn person URN or X user id. */
  userId: string;
  name: string;
  connectedAt: string;
};
type Tokens = Partial<Record<ApiNetwork, Token>>;

const KEY = "social_tokens";

async function readTokens(): Promise<Tokens> {
  const [row] = await db.select().from(settings).where(eq(settings.key, KEY)).limit(1);
  return (row?.value as Tokens) ?? {};
}

async function writeToken(net: ApiNetwork, token: Token | null) {
  const all = await readTokens();
  if (token) all[net] = token;
  else delete all[net];
  await db
    .insert(settings)
    .values({ key: KEY, value: all, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value: all, updatedAt: new Date() } });
}

const env = {
  linkedin: () => ({ id: process.env.LINKEDIN_CLIENT_ID, secret: process.env.LINKEDIN_CLIENT_SECRET }),
  x: () => ({ id: process.env.X_CLIENT_ID, secret: process.env.X_CLIENT_SECRET }),
};

export const apiConfigured = (net: ApiNetwork) => {
  const e = env[net]();
  return !!(e.id && e.secret);
};

export class SocialApiError extends Error {}

/** What the Studio shows about each connection (no secrets). */
export async function connections() {
  const tokens = await readTokens();
  return Object.fromEntries(
    API_NETWORKS.map((n) => {
      const t = tokens[n];
      const expired = t ? new Date(t.expiresAt) < new Date() && !t.refreshToken : false;
      return [n, { configured: apiConfigured(n), connected: !!t && !expired, name: t?.name ?? null, expiresAt: t?.expiresAt ?? null, refreshes: !!t?.refreshToken }];
    }),
  ) as Record<ApiNetwork, { configured: boolean; connected: boolean; name: string | null; expiresAt: string | null; refreshes: boolean }>;
}

export const disconnect = (net: ApiNetwork) => writeToken(net, null);

/* OAuth ------------------------------------------------------------------ */

const redirectUri = (origin: string, net: ApiNetwork) => `${origin}/studio/social/callback/${net}`;

/** Where to send the browser to connect, plus what to keep in a cookie until the callback. */
export function authorizeUrl(net: ApiNetwork, origin: string) {
  const { id } = env[net]();
  if (!id) throw new SocialApiError("Application non configurée.");
  const state = randomBytes(16).toString("base64url");
  if (net === "linkedin") {
    const q = new URLSearchParams({ response_type: "code", client_id: id, redirect_uri: redirectUri(origin, net), state, scope: "openid profile w_member_social" });
    return { url: `https://www.linkedin.com/oauth/v2/authorization?${q}`, state, verifier: "" };
  }
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const q = new URLSearchParams({
    response_type: "code",
    client_id: id,
    redirect_uri: redirectUri(origin, net),
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return { url: `https://x.com/i/oauth2/authorize?${q}`, state, verifier };
}

async function json(res: Response, what: string) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[social-api] ${what}`, res.status, body);
    throw new SocialApiError(`${what} : refusé par le réseau (${res.status}).`);
  }
  return body;
}

const basic = (id: string, secret: string) => `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;

/** Exchanges the callback code for tokens and stores them. */
export async function completeAuth(net: ApiNetwork, code: string, verifier: string, origin: string) {
  const { id, secret } = env[net]();
  if (!id || !secret) throw new SocialApiError("Application non configurée.");

  if (net === "linkedin") {
    const tok = await json(
      await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri(origin, net), client_id: id, client_secret: secret }),
      }),
      "Connexion LinkedIn",
    );
    const me = await json(await fetch("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${tok.access_token}` } }), "Profil LinkedIn");
    await writeToken(net, {
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token,
      expiresAt: new Date(Date.now() + (tok.expires_in ?? 5184000) * 1000).toISOString(),
      userId: `urn:li:person:${me.sub}`,
      name: me.name ?? "LinkedIn",
      connectedAt: new Date().toISOString(),
    });
    return;
  }

  const tok = await json(
    await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: basic(id, secret) },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri(origin, net), code_verifier: verifier }),
    }),
    "Connexion X",
  );
  const me = await json(await fetch("https://api.x.com/2/users/me", { headers: { Authorization: `Bearer ${tok.access_token}` } }), "Profil X");
  await writeToken(net, {
    accessToken: tok.access_token,
    refreshToken: tok.refresh_token,
    expiresAt: new Date(Date.now() + (tok.expires_in ?? 7200) * 1000).toISOString(),
    userId: me.data.id,
    name: `@${me.data.username}`,
    connectedAt: new Date().toISOString(),
  });
}

/** A valid access token, refreshed when the network allows it. */
async function accessToken(net: ApiNetwork): Promise<Token> {
  const t = (await readTokens())[net];
  if (!t) throw new SocialApiError("Compte non connecté. Connectez-le dans Réseaux sociaux → Comptes.");
  if (new Date(t.expiresAt).getTime() - Date.now() > 60_000) return t;
  if (!t.refreshToken) throw new SocialApiError("La connexion a expiré : reconnectez le compte.");

  const { id, secret } = env[net]();
  const res =
    net === "x"
      ? await fetch("https://api.x.com/2/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: basic(id!, secret!) },
          body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: t.refreshToken }),
        })
      : await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: t.refreshToken, client_id: id!, client_secret: secret! }),
        });
  const tok = await json(res, "Renouvellement de la connexion");
  const next = {
    ...t,
    accessToken: tok.access_token,
    refreshToken: tok.refresh_token ?? t.refreshToken,
    expiresAt: new Date(Date.now() + (tok.expires_in ?? 7200) * 1000).toISOString(),
  };
  await writeToken(net, next);
  return next;
}

/* Posting ------------------------------------------------------------------ */

/** LinkedIn "little text": reserved characters are escaped, #hashtags become real hashtags. */
function linkedinText(text: string) {
  const escaped = text.replace(/[\\|{}@[\]()<>*_~]/g, (c) => `\\${c}`);
  return escaped.replace(/#([\p{L}\p{N}_]+)|#/gu, (m, tag) => (tag ? `{hashtag|\\#|${tag}}` : "\\#"));
}

/** A LinkedIn API version (YYYYMM) a few months old: versions stay supported for about a year. */
function linkedinVersion() {
  if (process.env.LINKEDIN_API_VERSION) return process.env.LINKEDIN_API_VERSION;
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - 3);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Publishes a text post now. Returns the public URL of the post. */
export async function publishText(net: ApiNetwork, text: string): Promise<string> {
  const t = await accessToken(net);

  if (net === "linkedin") {
    const res = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t.accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": linkedinVersion(),
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: t.userId,
        commentary: linkedinText(text),
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
    });
    if (!res.ok) {
      console.error("[social-api] LinkedIn post", res.status, await res.text().catch(() => ""));
      throw new SocialApiError(`LinkedIn a refusé la publication (${res.status}).`);
    }
    const urn = res.headers.get("x-restli-id");
    return urn ? `https://www.linkedin.com/feed/update/${urn}/` : "https://www.linkedin.com/feed/";
  }

  const body = await json(
    await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: { Authorization: `Bearer ${t.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }),
    "Publication X",
  );
  return `https://x.com/${t.name.replace(/^@/, "")}/status/${body.data.id}`;
}
