import type { Metadata } from "next";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import { mailEnabled, studioSends, studioSubscribers, subscriberCounts } from "@/lib/newsletter";
import { studioListNotes } from "@/lib/notes";
import { NewsletterManager } from "./newsletter-manager";

export const metadata: Metadata = { title: "Newsletter" };

export default async function NewsletterPage() {
  const [counts, subs, sends, notes] = await Promise.all([subscriberCounts(), studioSubscribers(), studioSends(), studioListNotes({ status: "published" })]);
  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Blog", href: "/studio/notes" }, { label: "Newsletter" }]} />
      <div className="flex flex-col gap-7 p-[clamp(24px,3vw,40px)]">
        <StudioHeading
          kicker="Blog"
          title="Newsletter"
          intro="Les abonnés s'inscrivent depuis la page Blog et confirment par email. Chacun reçoit la note dans sa langue, avec un lien de désinscription."
        />
        {!mailEnabled() && (
          <p role="note" className="m-0 rounded-2xl bg-blob-c/60 px-5 py-4 text-sm leading-relaxed">
            <strong>Envoi en pause : pas encore de domaine vérifié.</strong> Les inscriptions sont enregistrées et comptées comme confirmées, mais
            aucun email ne part. Vérifiez un domaine dans Resend, puis ajoutez <code className="font-mono">NEWSLETTER_FROM</code> (une adresse de ce
            domaine) avec <code className="font-mono">RESEND_API_KEY</code> pour envoyer.
          </p>
        )}
        <NewsletterManager
          counts={counts}
          subscribers={subs.map((s) => ({ id: s.id, email: s.email, locale: s.locale, status: s.status, createdAt: s.createdAt.toISOString() }))}
          sends={sends.map((s) => ({ id: s.id, noteId: s.noteId, subject: s.subject, recipients: s.recipients, sentAt: s.sentAt.toISOString() }))}
          notes={notes.map((n) => ({ id: n.id, title: n.title, publishedAt: n.publishedAt?.toISOString() ?? null }))}
        />
      </div>
    </>
  );
}
