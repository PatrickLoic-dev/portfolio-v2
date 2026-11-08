import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getSetting } from "@/lib/portfolio";
import { steamConfigured, syncSteam } from "@/lib/steam";

/**
 * Nightly Steam sync (vercel.json schedules it). Protected by CRON_SECRET,
 * which Vercel sends as "Authorization: Bearer <secret>".
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const steam = await getSetting("steam");
  if (!steam.autoSync || !steam.steamId || !steamConfigured()) return NextResponse.json({ skipped: true });

  try {
    const count = await syncSteam(steam.steamId);
    revalidatePath("/[locale]", "layout");
    return NextResponse.json({ synced: count });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "sync failed" }, { status: 502 });
  }
}
