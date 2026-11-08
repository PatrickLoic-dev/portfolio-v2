import type { Metadata } from "next";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import { getSetting } from "@/lib/portfolio";
import { AccountsForm } from "./accounts-form";

export const metadata: Metadata = { title: "Comptes" };

export default async function SocialAccountsPage() {
  const social = await getSetting("social");
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
      </div>
    </>
  );
}
