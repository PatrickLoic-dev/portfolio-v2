import { EyeOff } from "lucide-react";
import { getTranslations } from "next-intl/server";

/** Shown on a draft opened through a Studio preview link. */
export async function PreviewBanner() {
  const t = await getTranslations("preview");
  return (
    <div role="note" className="sticky top-0 z-30 bg-ink text-background">
      <div className="wrap flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
        <EyeOff size={16} aria-hidden className="text-blob-b" />
        <strong className="font-semibold">{t("title")}</strong>
        <span className="text-background/75">{t("body")}</span>
      </div>
    </div>
  );
}
