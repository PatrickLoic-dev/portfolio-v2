import { ArrowUpRight, Code2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandIcon } from "@/components/brand-icon";
import { TechChip, TechList } from "@/components/tech";
import type { PublicProject as Project } from "@/lib/portfolio";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { ProjectMedia } from "./project-media";

function Arrow({ filled = false, size = 40 }: { filled?: boolean; size?: number }) {
  return (
    <span
      className={cn(
        "card-arrow inline-flex flex-none items-center justify-center rounded-full",
        filled ? "bg-ink text-card" : "hairline border",
      )}
      style={{ width: size, height: size }}
    >
      <ArrowUpRight size={size > 40 ? 18 : 16} aria-hidden />
    </span>
  );
}

/** Large hero card (Home, first project). */
export function ProjectFeature({ project }: { project: Project }) {
  return (
    <Link href={`/work/${project.slug}`} className="card-link block">
      <div className="overflow-hidden rounded-[28px]">
        <ProjectMedia project={project} size="hero" className="aspect-[16/8] min-h-[320px]" />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-6 pt-6">
        <div className="flex flex-wrap items-baseline gap-6">
          <span className="label text-muted-foreground">{project.n}</span>
          <span className="card-title display text-[36px] tracking-[-0.03em]">{project.name}</span>
        </div>
        <p className="m-0 max-w-[520px] flex-[1_1_360px] text-base leading-[1.55] text-muted-foreground">
          {project.description}
        </p>
        <div className="flex items-center gap-2">
          {project.tags.map((tag) => (
            <TechChip key={tag} name={tag} />
          ))}
          <Arrow filled size={44} />
        </div>
      </div>
    </Link>
  );
}

/** Two-up card on Home: name + "Type — Tech / Tech". */
export function ProjectTile({ project }: { project: Project }) {
  const t = useTranslations("types");
  return (
    <Link href={`/work/${project.slug}`} className="card-link block">
      <div className="overflow-hidden rounded-3xl">
        <ProjectMedia project={project} size="feature" className="aspect-[4/3]" />
      </div>
      <div className="flex items-start justify-between gap-4 pt-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-4">
            <span className="label text-muted-foreground">{project.n}</span>
            <span className="card-title display text-[28px] tracking-[-0.03em]">{project.name}</span>
          </div>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] text-muted-foreground">
            {t(project.type)}
            <TechList names={project.tags} />
          </span>
        </div>
        <Arrow size={44} />
      </div>
    </Link>
  );
}

/** Grid card on the Work page. */
export function ProjectCard({ project }: { project: Project }) {
  const t = useTranslations("types");
  return (
    <Link href={`/work/${project.slug}`} className="card-link block">
      <div className="overflow-hidden rounded-[22px]">
        <ProjectMedia project={project} size="card" className="aspect-[5/4]" />
      </div>
      <div className="flex flex-col gap-2.5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3.5">
            <span className="label text-muted-foreground">{project.n}</span>
            <span className="card-title display text-[26px] tracking-[-0.03em]">{project.name}</span>
          </div>
          <Arrow />
        </div>
        <p className="m-0 text-[15px] leading-[1.55] text-muted-foreground">{project.description}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className="chip chip-ink">{t(project.type)}</span>
          {project.tags.map((tag) => (
            <TechChip key={tag} name={tag} />
          ))}
        </div>
      </div>
    </Link>
  );
}

/**
 * Side-project card: the case study link, plus a separate link to the
 * source code when the project is open source (links can't be nested).
 */
export function SideProjectCard({ project }: { project: Project }) {
  const t = useTranslations("work");
  return (
    <article className="flex flex-col">
      <Link href={`/work/${project.slug}`} className="card-link block">
        <div className="overflow-hidden rounded-[22px]">
          <ProjectMedia project={project} size="card" className="aspect-[5/4]" />
        </div>
        <div className="flex flex-col gap-2.5 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-3.5">
              <span className="label text-muted-foreground">{project.n}</span>
              <span className="card-title display text-[26px] tracking-[-0.03em]">{project.name}</span>
            </div>
            <Arrow />
          </div>
          <p className="m-0 text-[15px] leading-[1.55] text-muted-foreground">{project.description}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className={cn("chip", project.openSource && "chip-ink")}>{project.openSource ? t("openSource") : t("closedSource")}</span>
            {project.tags.map((tag) => (
              <TechChip key={tag} name={tag} />
            ))}
          </div>
        </div>
      </Link>
      {project.repo && (
        <a
          href={project.repo}
          target="_blank"
          rel="noreferrer"
          className="link-underline mt-3.5 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold"
        >
          <RepoIcon url={project.repo} />
          {t("viewCode")}
          <ArrowUpRight size={14} aria-hidden />
        </a>
      )}
    </article>
  );
}

/** GitHub mark for GitHub repos, a generic code icon otherwise. */
export function RepoIcon({ url, size = 16 }: { url: string; size?: number }) {
  return /github\.com/i.test(url) ? <BrandIcon brand="github" size={size} /> : <Code2 size={size} aria-hidden />;
}

/** Row in the Work list view. */
export function ProjectRow({ project }: { project: Project }) {
  const t = useTranslations("types");
  return (
    <Link
      href={`/work/${project.slug}`}
      className="card-link hairline grid grid-cols-[40px_minmax(0,1fr)_44px] items-center gap-6 border-t py-7 transition-[padding,background-color] duration-250 hover:bg-surface hover:px-3 nav:grid-cols-[60px_minmax(0,1.2fr)_minmax(0,2fr)_auto_44px]"
    >
      <span className="label text-muted-foreground">{project.n}</span>
      <span className="card-title display text-[clamp(24px,2.6vw,36px)] tracking-[-0.03em]">{project.name}</span>
      <span className="hidden text-[15px] leading-normal text-muted-foreground nav:block">
        {project.description}
      </span>
      <span className="label hidden text-muted-foreground nav:block">{t(project.type)}</span>
      <Arrow size={44} />
    </Link>
  );
}
