import { NextResponse, type NextRequest } from "next/server";
import { unsubscribe } from "@/lib/newsletter";

const valid = (t: string) => /^[\w-]{20,64}$/.test(t);

/** Link in every email. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const locale = valid(token) ? await unsubscribe(token) : null;
  const url = req.nextUrl.clone();
  url.pathname = `${locale === "fr" ? "/fr" : ""}/newsletter`;
  url.search = `?statut=${locale ? "unsubscribed" : "invalid"}`;
  return NextResponse.redirect(url);
}

/** One-click unsubscribe from the mail client (RFC 8058). */
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (valid(token)) await unsubscribe(token);
  return new NextResponse(null, { status: 200 });
}
