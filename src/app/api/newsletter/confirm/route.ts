import { NextResponse, type NextRequest } from "next/server";
import { confirmSubscriber } from "@/lib/newsletter";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const locale = /^[\w-]{20,64}$/.test(token) ? await confirmSubscriber(token) : null;
  const url = req.nextUrl.clone();
  url.pathname = `${locale === "fr" ? "/fr" : ""}/newsletter`;
  url.search = `?statut=${locale ? "confirmed" : "invalid"}`;
  return NextResponse.redirect(url);
}
