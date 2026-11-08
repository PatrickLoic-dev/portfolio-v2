import { ArrowUpRight } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { Post } from "@/content/posts";
import { tones } from "@/content/projects";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function PostCover({ post, size = "md" }: { post: Post; size?: "md" | "sm" }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("blog");
  const tone = tones[post.tone];
  return (
    <div
      className="card-media flex aspect-[16/10] flex-col justify-between"
      style={{ background: tone.bg, color: tone.ink, padding: size === "md" ? 24 : 22 }}
    >
      <span className="label">{t(`categories.${post.category}.label`)}</span>
      <span className={`display whitespace-pre-line ${size === "md" ? "text-[40px]" : "text-[36px]"}`}>
        {post.text[locale].hook}
      </span>
    </div>
  );
}

export function PostCard({ post }: { post: Post }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("blog");
  const format = useFormatter();
  const text = post.text[locale];
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
        <h3 className="card-title heading text-2xl leading-[1.15] tracking-[-0.02em]">{text.title}</h3>
        <p className="m-0 text-[15px] leading-relaxed text-muted-foreground">{text.excerpt}</p>
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
