import type { Metadata } from "next";
import { headers } from "next/headers";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import { getSetting } from "@/lib/portfolio";
import { connections } from "@/lib/social-api";
import { AccountsForm } from "./accounts-form";
import { ApiConnections } from "./api-connections";

export const metadata: Metadata = { title: "Comptes" };

export default async function SocialAccountsPage({ searchParams }: PageProps<"/studio/social/accounts">) {
  const [social, conns, h, sp] = await Promise.all([getSetting("social"), connections(), headers(), searchParams]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3100";
  const origin = `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Réseaux sociaux", href: "/studio/social" }, { label: "Comptes" }]} />
      <div className="flex flex-col gap-6 p-[clamp(24px,3vw,40px)]">
        <StudioHeading
          kicker="Comptes · Créneaux · Règles"
          title="Comptes"
          intro="Vos profils, et les créneaux où votre audience est la plus active. Le Composer s'en sert pour proposer l'heure et pour la file d'attente."
        />
        <AccountsForm initial={social} />
        <ApiConnections conns={conns} origin={origin} status={typeof sp.connexion === "string" ? sp.connexion : null} />
      </div>
    </>
  );
}
