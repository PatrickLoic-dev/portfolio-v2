import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServer } from "./supabase/server";

export function isAdminEmail(email: string | null | undefined) {
  const admin = process.env.ADMIN_EMAIL?.toLowerCase();
  return !!admin && email?.toLowerCase() === admin;
}

/** The signed-in admin, or null. Validated against Supabase Auth (not just the cookie). */
export const getAdmin = cache(async () => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return isAdminEmail(data.user?.email) ? data.user : null;
});

/**
 * Gate for every Studio page and server action. The proxy already redirects
 * anonymous visitors; this re-checks so an action can never run without a session.
 */
export async function requireAdmin() {
  const user = await getAdmin();
  if (!user) redirect("/studio/login");
  return user;
}
