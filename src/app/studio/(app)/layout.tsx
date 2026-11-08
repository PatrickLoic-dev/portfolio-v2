import { Suspense, type ReactNode } from "react";
import { StudioSidebar } from "@/components/studio/sidebar";
import { ToastProvider } from "@/components/studio/toast";
import { requireAdmin } from "@/lib/auth";
import { promoteDueNotes, studioCounts, studioSubjects } from "@/lib/notes";
import { studioGames, studioProjects } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export default async function StudioAppLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  await promoteDueNotes();
  const [counts, subjects, projects, games] = await Promise.all([studioCounts(), studioSubjects(), studioProjects(), studioGames()]);

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-background nav:flex-row">
        <Suspense>
          <StudioSidebar
            counts={{ ...counts, subjects: subjects.length, projects: projects.length, games: games.length }}
            email={user.email ?? ""}
          />
        </Suspense>
        <main id="content" className="flex min-w-0 flex-1 flex-col">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
