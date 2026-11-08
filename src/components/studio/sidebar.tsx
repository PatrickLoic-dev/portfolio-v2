"use client";

import { FileText, Gamepad2, LayoutGrid, LogOut, Menu, Share2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "@/app/studio/actions";
import { cn } from "@/lib/cn";

type Counts = { all: number; published: number; draft: number; scheduled: number; subjects: number; projects: number; games: number };

function Item({
  href,
  active,
  count,
  children,
  onNavigate,
}: {
  href: string;
  active: boolean;
  count?: number | string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[38px] w-full items-center justify-between gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors",
        active ? "bg-background text-ink" : "text-background/80 hover:bg-background/8 hover:text-background",
      )}
    >
      <span>{children}</span>
      {count !== undefined && <span className="font-mono text-[11px] opacity-75">{count}</span>}
    </Link>
  );
}

/** Not built yet (later phases): shown so the Studio map matches the design. */
function Soon({ children }: { children: ReactNode }) {
  return (
    <span className="flex min-h-[38px] items-center justify-between gap-2 px-3 text-sm font-medium text-background/45">
      {children}
      <span className="rounded-full border border-background/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">Bientôt</span>
    </span>
  );
}

function Group({ icon, label, color, children }: { icon: ReactNode; label: string; color: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-background/12 pt-3.5">
      <span className="mb-1 flex items-center gap-2 px-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color }}>
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}

export function StudioSidebar({ counts, email }: { counts: Counts; email: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const statut = params.get("statut") ?? "all";
  const onNotes = pathname === "/studio/notes";
  const close = () => setOpen(false);

  return (
    <aside aria-label="Navigation du studio" className="bg-ink text-background nav:sticky nav:top-0 nav:h-screen nav:w-[264px] nav:flex-none nav:overflow-y-auto">
      <div className="flex items-center justify-between gap-4 px-5 py-4 nav:block nav:px-[26px] nav:pb-0 nav:pt-6">
        <Link href="/studio" className="flex flex-col gap-1.5" onClick={close}>
          <span className="display text-xl leading-none tracking-[-0.02em]">
            Patrick Loic<span className="text-accent">.</span>
          </span>
          <span className="label text-[11px] text-background/60">Studio · Contenu, social &amp; passions</span>
        </Link>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full border border-background/20 nav:hidden"
          aria-expanded={open}
          aria-controls="studio-nav"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        </button>
      </div>

      <div id="studio-nav" className={cn("flex-col gap-[22px] px-3.5 pb-6 pt-2 nav:flex nav:min-h-[calc(100vh-88px)] nav:pt-[22px]", open ? "flex" : "hidden")}>
        <nav className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-0.5">
            <span className="px-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-background/60">Pilotage</span>
            <Item href="/studio" active={pathname === "/studio"} onNavigate={close}>
              Tableau de bord
            </Item>
          </div>

          <Group icon={<FileText size={14} aria-hidden />} label="Blog" color="var(--blob-a)">
            <Item href="/studio/notes" active={onNotes && statut === "all"} count={counts.all} onNavigate={close}>
              Toutes les notes
            </Item>
            <Item href="/studio/notes/new" active={pathname === "/studio/notes/new"} onNavigate={close}>
              Nouvelle note
            </Item>
            <Item href="/studio/notes?statut=published" active={onNotes && statut === "published"} count={counts.published} onNavigate={close}>
              Publiées
            </Item>
            <Item href="/studio/notes?statut=draft" active={onNotes && statut === "draft"} count={counts.draft} onNavigate={close}>
              Brouillons
            </Item>
            <Item href="/studio/notes?statut=scheduled" active={onNotes && statut === "scheduled"} count={counts.scheduled} onNavigate={close}>
              Programmées
            </Item>
            <Item href="/studio/subjects" active={pathname === "/studio/subjects"} count={counts.subjects} onNavigate={close}>
              Sujets
            </Item>
          </Group>

          <Group icon={<LayoutGrid size={14} aria-hidden />} label="Projets" color="var(--blob-c)">
            <Item href="/studio/projects" active={pathname === "/studio/projects"} count={counts.projects} onNavigate={close}>
              Tous les projets
            </Item>
            <Item href="/studio/projects/new" active={pathname === "/studio/projects/new"} onNavigate={close}>
              Nouveau projet
            </Item>
          </Group>
          <Group icon={<Share2 size={14} aria-hidden />} label="Réseaux sociaux" color="var(--blob-b)">
            <Soon>Composer &amp; programmer</Soon>
          </Group>
          <Group icon={<Gamepad2 size={14} aria-hidden />} label="Passions" color="var(--secondary)">
            <Item href="/studio/passions/games" active={pathname === "/studio/passions/games"} count={counts.games} onNavigate={close}>
              Jeux vidéo
            </Item>
            <Item href="/studio/passions/music" active={pathname === "/studio/passions/music"} onNavigate={close}>
              Musique &amp; humeur
            </Item>
          </Group>
        </nav>

        <div className="mt-auto flex flex-col gap-0.5 border-t border-background/12 pt-3.5">
          <a href="/blog" target="_blank" className="flex min-h-[38px] items-center rounded-xl px-3 text-sm font-medium text-background/80 hover:bg-background/8 hover:text-background">
            Voir le blog ↗
          </a>
          <Link href="/" className="flex min-h-[38px] items-center rounded-xl px-3 text-sm font-medium text-background/80 hover:bg-background/8 hover:text-background">
            ← Retour au site
          </Link>
          <div className="flex items-center gap-3 px-3 pt-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-full bg-blob-b text-sm font-bold text-ink" aria-hidden>
              PL
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold">Patrick Loic</span>
              <span className="truncate text-xs text-background/60" title={email}>
                Administrateur
              </span>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex size-9 items-center justify-center rounded-full text-background/70 hover:bg-background/10 hover:text-background"
                aria-label="Se déconnecter"
                title="Se déconnecter"
              >
                <LogOut size={16} aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}
