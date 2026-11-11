import { Suspense, type ReactNode } from "react";
import { StudioSidebar } from "@/components/studio/sidebar";
import { FeaturesProvider } from "@/components/studio/features";
import { ToastProvider } from "@/components/studio/toast";
import { aiEnabled } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { promoteDueNotes, studioCounts, studioSubjects } from "@/lib/notes";
import { studioGames, studioProjects } from "@/lib/portfolio";
import { socialCounts } from "@/lib/social-data";
import { studioTestimonials } from "@/lib/kind-words";
import { mailEnabled, subscriberCounts } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export default async function StudioAppLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  await promoteDueNotes();
  const [counts, subjects, projects, games, social, subs, testimonials] = await Promise.all([
    studioCounts(),
    studioSubjects(),
    studioProjects(),
    studioGames(),
    socialCounts(),
    subscriberCounts(),
    studioTestimonials(),
  ]);

  return (
    <FeaturesProvider value={{ ai: aiEnabled(), mail: mailEnabled() }}>
      <ToastProvider>
        <div className="flex min-h-screen flex-col bg-background nav:flex-row">
          <Suspense>
            <StudioSidebar
              counts={{
                ...counts,
                subjects: subjects.length,
                projects: projects.length,
                games: games.length,
                socialDue: social.due,
                subscribers: subs.active,
                testimonials: testimonials.length,
              }}
              email={user.email ?? ""}
            />
          </Suspense>
          <main id="content" className="flex min-w-0 flex-1 flex-col">
            {children}
          </main>
        </div>
      </ToastProvider>
    </FeaturesProvider>
  );
}
