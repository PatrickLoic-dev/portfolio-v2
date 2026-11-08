import { useTranslations } from "next-intl";
import { SplitHeadline } from "@/components/motion/split-headline";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <section className="wrap flex min-h-[70vh] flex-col justify-center gap-8 py-24">
      <span className="label text-accent-ink">404</span>
      <SplitHeadline as="h1" immediate text={t("title")} accent="." className="text-[clamp(64px,11vw,168px)]" />
      <p className="m-0 max-w-[440px] text-lg text-muted-foreground">{t("body")}</p>
      <div>
        <Link href="/" className="btn btn-primary">{t("home")}</Link>
      </div>
    </section>
  );
}
