import { ArrowUpRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { tones } from "@/content/projects";
import { Link } from "@/i18n/navigation";
import type { PublicPost } from "@/lib/notes";

/** Cover: uploaded image, or the tone panel with the display hook. */
export function PostCover({ post, size = "md" }: { post: PublicPost; size?: "md" | "sm" }) {
  const tone = tones[post.tone] ?? tones.peach;
  return (
    <div
      className="card-media relative flex aspect-[16/10] flex-col justify-between overflow-hidden"
      style={{ background: tone.bg, color: tone.ink, padding: size === "md" ? 24 : 22 }}
    >
      {post.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverUrl} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
      )}
      <span className="label relative">{post.subject.label}</span>
      {!post.coverUrl && (
        <span className={`display relative whitespace-pre-line ${size === "md" ? "text-[40px]" : "text-[36px]"}`}>{post.hook}</span>
      )}
    </div>
  );
}

export function PostCard({ post }: { post: PublicPost }) {
  const t = useTranslations("blog");
  const format = useFormatter();
  return (
    <Link href={`/blog/${post.slug}`} className="card-link flex flex-col gap-5">
      <div className="overflow-hidden rounded-[22px]">
        <PostCover post={post} />
      </div>
      <div className="flex flex-col gap-3">
        <span className="label text-muted-foreground">
          {format.dateTime(new Date(post.date), { day: "numeric", month: "short", year: "numeric" })} ·{" "}
          {t("min", { min: post.minutes })}
        </span>
        <h3 className="card-title heading text-2xl leading-[1.15] tracking-[-0.02em]">{post.title}</h3>
        <p className="m-0 text-[15px] leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <span className="mt-1 inline-flex items-center gap-2 text-sm font-semibold">
          {t("read")}
          <ArrowUpRight size={16} className="card-arrow" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function PostByline({ size = 44 }: { size?: number }) {
  const t = useTranslations("blog");
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex items-center justify-center rounded-full bg-blob-b text-sm font-bold"
        style={{ width: size, height: size }}
        aria-hidden
      >
        PL
      </span>
      <div className="flex flex-col">
        <span className="text-[15px] font-semibold">Patrick Loic</span>
        <span className="text-[13px] text-muted-foreground">{t("author")}</span>
      </div>
    </div>
  );
}
