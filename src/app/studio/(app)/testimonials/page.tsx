import type { Metadata } from "next";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import { studioClients, studioTestimonials } from "@/lib/kind-words";
import type { TestimonialInput } from "../../site-actions";
import { ClientsManager } from "./clients-manager";
import { TestimonialsManager } from "./testimonials-manager";

export const metadata: Metadata = { title: "Témoignages & clients" };

export default async function TestimonialsPage() {
  const [testimonials, clients] = await Promise.all([studioTestimonials(), studioClients()]);
  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Site" }, { label: "Témoignages & clients" }]} />
      <div className="flex flex-col gap-10 p-[clamp(24px,3vw,40px)]">
        <StudioHeading
          kicker="Site"
          title="Témoignages & clients"
          intro="Les témoignages défilent sur l'accueil et la page À propos, dans cet ordre. Les logos forment la bande « Ils me font confiance » de l'accueil, masquée tant qu'elle est vide."
        />
        <TestimonialsManager
          initial={testimonials.map((t) => ({
            id: t.id,
            name: t.name,
            initials: t.initials,
            tone: t.tone as TestimonialInput["tone"],
            roleEn: t.roleEn,
            roleFr: t.roleFr,
            company: t.company,
            quoteEn: t.quoteEn,
            quoteFr: t.quoteFr,
            visible: t.visible,
          }))}
        />
        <ClientsManager initial={clients.map((c) => ({ id: c.id, name: c.name, logoUrl: c.logoUrl, url: c.url, visible: c.visible }))} />
      </div>
    </>
  );
}
