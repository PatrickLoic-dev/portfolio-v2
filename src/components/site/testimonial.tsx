import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/reveal";

export function Testimonial({ eyebrow }: { eyebrow: string }) {
  const t = useTranslations("testimonial");
  return (
    <section className="bg-surface">
      <div className="wrap flex flex-col gap-10 py-28">
        <span className="label text-accent-ink">{eyebrow}</span>
        <Reveal as="figure" className="m-0 flex flex-col gap-10">
          <blockquote className="heading m-0 max-w-[1100px] text-[clamp(28px,3.6vw,52px)] leading-[1.12]">
            <span className="text-accent">“</span>
            {t("quote")}
            <span className="text-accent">”</span>
          </blockquote>
          <figcaption className="flex items-center gap-4">
            <span className="flex size-[52px] items-center justify-center rounded-full bg-blob-b font-bold" aria-hidden>
              AM
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold">{t("name")}</span>
              <span className="text-sm text-muted-foreground">{t("role")}</span>
            </span>
          </figcaption>
        </Reveal>
      </div>
    </section>
  );
}
