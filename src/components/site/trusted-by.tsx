import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";

type Client = { id: string; name: string; logoUrl: string | null; url: string | null };

/** "Trusted by": a quiet row of client logos (names when there is no logo yet). Hidden when empty. */
export function TrustedBy({ label, clients }: { label: string; clients: Client[] }) {
  if (!clients.length) return null;
  return (
    <section className="wrap pb-24 pt-8" aria-labelledby="trusted-by">
      <Reveal className="flex flex-col gap-8">
        <h2 id="trusted-by" className="label m-0 text-muted-foreground">
          {label}
        </h2>
        <ul className="m-0 flex list-none flex-wrap items-center gap-x-12 gap-y-8 p-0">
          {clients.map((c) => {
            const mark = c.logoUrl ? (
              <Image
                src={c.logoUrl}
                alt={c.name}
                width={160}
                height={48}
                unoptimized
                className="h-9 w-auto max-w-[160px] object-contain opacity-60 grayscale transition-[filter,opacity] duration-300 group-hover:opacity-100 group-hover:grayscale-0"
              />
            ) : (
              <span className="display text-2xl text-muted-foreground transition-colors group-hover:text-foreground">{c.name}</span>
            );
            return (
              <li key={c.id}>
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noreferrer" className="group inline-flex min-h-11 items-center" title={c.name}>
                    {mark}
                  </a>
                ) : (
                  <span className="group inline-flex min-h-11 items-center">{mark}</span>
                )}
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}
