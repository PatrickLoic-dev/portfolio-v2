import type { PublicProject } from "@/lib/portfolio";
import { cn } from "@/lib/cn";
import { toneOf } from "@/lib/tones";

type Size = "hero" | "feature" | "card";

const frame: Record<Size, { pad: string; dot: string; bar: string; title: string; radius: string }> = {
  hero: { pad: "px-[8%] pt-14", dot: "size-2.5", bar: "px-[18px] py-3.5", title: "text-[clamp(40px,6vw,96px)]", radius: "rounded-t-2xl" },
  feature: { pad: "px-10 pt-10", dot: "size-2", bar: "px-3.5 py-3", title: "text-[clamp(32px,3.6vw,52px)]", radius: "rounded-t-xl" },
  card: { pad: "px-9 pt-9", dot: "size-2", bar: "px-3.5 py-3", title: "text-[clamp(28px,3vw,36px)]", radius: "rounded-t-xl" },
};

/**
 * Product shot: a browser window (web) or a phone (mobile) rising from a
 * tone-coloured panel. Shows the first uploaded screenshot, else the name.
 */
export function ProjectMedia({
  project,
  size = "card",
  showHost = size === "hero",
  className,
}: {
  project: Pick<PublicProject, "name" | "tone" | "mobile" | "host" | "media">;
  size?: Size;
  showHost?: boolean;
  className?: string;
}) {
  const f = frame[size];
  const shot = project.media[0];

  return (
    <div className={cn("card-media flex items-end justify-center", f.pad, className)} style={{ background: toneOf(project.tone).bg }}>
      {project.mobile ? (
        <div className="relative flex h-[92%] w-[46%] max-w-[220px] flex-col justify-center gap-2 overflow-hidden rounded-t-[28px] border-[6px] border-b-0 border-ink bg-card p-5">
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot} alt="" className="absolute inset-0 size-full object-cover object-top" loading="lazy" />
          ) : (
            <span className="display text-[clamp(22px,2.4vw,28px)]">{project.name}</span>
          )}
        </div>
      ) : (
        <div className={cn("flex h-[86%] w-full flex-col overflow-hidden bg-card", f.radius)}>
          <div className={cn("hairline flex items-center gap-1.5 border-b", f.bar)}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("rounded-full bg-ink/20", f.dot)} />
            ))}
            {showHost && <span className="ml-4 font-mono text-xs text-muted-foreground">{project.host}</span>}
          </div>
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot} alt="" className="min-h-0 w-full flex-1 object-cover object-top" loading="lazy" />
          ) : (
            <div className="flex flex-1 flex-col justify-center gap-3 px-[6%] py-6">
              <span className={cn("display", f.title)}>{project.name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
