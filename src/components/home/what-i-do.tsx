"use client";

import { ArrowUp, Check, Plus, Sparkle } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type CSSProperties } from "react";
import { BrandIcon, type Brand } from "@/components/brand-icon";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { SplitHeadline } from "@/components/motion/split-headline";
import { TechList } from "@/components/tech";
import { Link } from "@/i18n/navigation";

/* ------------------------------------------------------------------ */
/* Home → "What I do": a bento of six small, live illustrations.       */
/* ------------------------------------------------------------------ */

export function WhatIDo() {
  const t = useTranslations("home");

  return (
    <section className="wrap flex flex-col gap-12 py-[clamp(64px,8vw,104px)]" aria-labelledby="wd-title">
      <div className="flex flex-col items-start gap-4">
        <span className="label text-accent-ink">{t("doEyebrow")}</span>
        <SplitHeadline text={t("wd.titleLead")} accent={t("wd.titleAccent")} className="text-[clamp(44px,6.5vw,96px)]" />
        <Reveal as="p" delay={0.1} className="m-0 max-w-[520px] text-[17px] leading-relaxed text-muted-foreground">
          {t("doBody")}
        </Reveal>
      </div>

      <div className="wd-bento">
        <Stagger className="wd-col">
          <StaggerItem>
            <WebCard />
          </StaggerItem>
          <StaggerItem>
            <MobileCard />
          </StaggerItem>
          <StaggerItem>
            <ApiCard />
          </StaggerItem>
        </Stagger>
        <Stagger className="wd-col">
          <StaggerItem>
            <StackCard />
          </StaggerItem>
          <StaggerItem>
            <DesignCard />
          </StaggerItem>
          <StaggerItem>
            <ModesCard />
          </StaggerItem>
        </Stagger>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/about" className="btn btn-ghost">
          {t("aboutMe")}
        </Link>
        <Link href="/process" className="btn btn-ghost">
          {t("howIWork")}
        </Link>
      </div>
    </section>
  );
}

function Card({ label, title, children, className, style }: { label: string; title: string; children: React.ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <article className={`wd-card ${className ?? ""}`} style={style}>
      <span className="wd-label">{label}</span>
      <h3 className="wd-title">{title}</h3>
      {children}
    </article>
  );
}

const Chips = ({ items }: { items: string[] }) => <TechList names={items} focusable />;

/* Web: a brief that types itself, over two soft glows. ----------------- */

function useTypewriter(phrases: string[]) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const full = phrases[index % phrases.length] ?? "";

  useEffect(() => {
    if (reduce) {
      const id = window.setTimeout(() => setIndex((i) => i + 1), 2800);
      return () => window.clearTimeout(id);
    }
    let delay = deleting ? 22 : 48;
    if (!deleting && shown === full.length) delay = 1600;
    if (deleting && shown === 0) delay = 300;
    const id = window.setTimeout(() => {
      if (!deleting && shown === full.length) setDeleting(true);
      else if (deleting && shown === 0) {
        setDeleting(false);
        setIndex((i) => i + 1);
      } else setShown((n) => n + (deleting ? -1 : 1));
    }, delay);
    return () => window.clearTimeout(id);
  }, [reduce, deleting, shown, full.length, index]);

  return { full, text: reduce ? full : full.slice(0, shown) };
}

function WebCard() {
  const t = useTranslations("home.wd.web");
  const { full, text } = useTypewriter(t.raw("phrases") as string[]);
  return (
    <Card label={t("label")} title={t("title")}>
      <div className="wd-stage min-h-[230px]">
        <span className="wd-glow bg-blob-a" aria-hidden style={{ width: "62%", height: 90, left: "12%", top: 64 }} />
        <span className="wd-glow bg-blob-b" aria-hidden style={{ width: "40%", height: 80, right: "8%", top: 84, animationDelay: "1.4s" }} />
        <div className="wd-prompt" role="img" aria-label={t("brief", { phrase: full })}>
          <span className="wd-prompt-btn bg-surface" aria-hidden>
            <Plus size={18} />
          </span>
          <span className="min-w-0 flex-1 truncate text-base" aria-hidden>
            {text}
            <span className="wd-caret" />
          </span>
          <span className="wd-prompt-btn size-[46px]! bg-ink text-card" aria-hidden>
            <ArrowUp size={18} />
          </span>
        </div>
      </div>
      <Chips items={["Angular", "Next.js", "React"]} />
    </Card>
  );
}

/* Mobile: a phone with an order notification, iOS or Android. --------- */

function MobileCard() {
  const t = useTranslations("home.wd.mobile");
  const [os, setOs] = useState<"ios" | "android">("android");
  const ios = os === "ios";
  return (
    <Card label={t("label")} title={t("title")}>
      <div className="wd-stage -mx-[30px] min-h-[250px] max-nav:-mx-[22px]">
        <span className="wd-grid-h" aria-hidden />
        <span className="wd-grid-v" aria-hidden />
        <div
          className="wd-phone"
          style={{ borderRadius: ios ? 30 : 22 }}
          role="img"
          aria-label={t("preview", { os: ios ? "iOS" : "Android" })}
        >
          {/* Dynamic Island on iOS, a punch-hole camera on Android. */}
          <span
            aria-hidden
            className="absolute left-1/2 top-1.5 -translate-x-1/2 bg-ink transition-all duration-400"
            style={ios ? { width: 46, height: 12, borderRadius: 999 } : { width: 8, height: 8, borderRadius: 999 }}
          />
          <div className="wd-notif mt-2">
            <span className="flex size-[26px] flex-none items-center justify-center rounded-lg bg-blob-b">
              <Check size={14} strokeWidth={2.6} aria-hidden />
            </span>
            <span className="flex flex-col leading-[1.15]">
              <b className="text-[11px]">{t("newOrder")}</b>
              <span className="text-[10px] text-muted-foreground">{t("booked")}</span>
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="h-2 w-4/5 rounded bg-ink/15" />
            <span className="h-2 w-[55%] rounded bg-ink/15" />
            <span
              className="flex h-[30px] items-center justify-center bg-ink text-[11px] font-bold text-card transition-[border-radius] duration-400"
              style={{ borderRadius: ios ? 10 : 999 }}
            >
              {t("track")}
            </span>
          </div>
        </div>
      </div>
      <div className="wd-seg" role="group" aria-label={t("platform")}>
        <button type="button" aria-pressed={ios} onClick={() => setOs("ios")}>
          iOS
        </button>
        <button type="button" aria-pressed={!ios} onClick={() => setOs("android")}>
          Android
        </button>
      </div>
    </Card>
  );
}

/* APIs: pick a payment method; the idempotency key keeps it single. --- */

function ApiCard() {
  const t = useTranslations("home.wd.api");
  const [pay, setPay] = useState<"momo" | "bank">("momo");
  const options = [
    { key: "momo" as const, label: t("momo"), badge: <Badge ok text={t("confirmed")} /> },
    { key: "bank" as const, label: t("bank"), badge: <Badge text={t("pending")} /> },
  ];
  return (
    <Card label={t("label")} title={t("title")}>
      <div className="wd-stage min-h-[200px] flex-col gap-3" role="radiogroup" aria-label={t("method")}>
        {options.map((o) => (
          <button key={o.key} type="button" role="radio" aria-checked={pay === o.key} className="wd-pay" onClick={() => setPay(o.key)}>
            <span className="wd-radio">{pay === o.key && <span className="size-2.5 rounded-full bg-success" />}</span>
            {o.label}
            {o.badge}
          </button>
        ))}
        <span className="font-mono text-xs text-muted-foreground">{t("key")}</span>
      </div>
      <Chips items={["NestJS", "Node.js", "PostgreSQL"]} />
    </Card>
  );
}

function Badge({ ok, text }: { ok?: boolean; text: string }) {
  return ok ? (
    <span className="wd-badge bg-secondary text-success-ink">
      <Check size={12} strokeWidth={3} aria-hidden />
      {text}
    </span>
  ) : (
    <span className="wd-badge bg-blob-c">
      <span className="wd-pending-dot" aria-hidden />
      {text}
    </span>
  );
}

/* Stack: real logos orbiting a "PL." core. ----------------------------- */

const TECH: { brand: Brand; bg: string; fg: string; pos: CSSProperties }[] = [
  { brand: "angular", bg: "#dd0031", fg: "#fff", pos: { left: "10%", top: "8%", rotate: "-9deg" } },
  { brand: "react", bg: "#20232a", fg: "#61dafb", pos: { right: "12%", top: "4%", rotate: "8deg", animationDelay: ".6s" } },
  { brand: "nestjs", bg: "#e0234e", fg: "#fff", pos: { left: "4%", top: "44%", rotate: "6deg", animationDelay: "1.2s" } },
  { brand: "docker", bg: "#1d63ed", fg: "#fff", pos: { right: "4%", top: "42%", rotate: "-6deg", animationDelay: "1.8s" } },
  { brand: "nextdotjs", bg: "#000", fg: "#fff", pos: { left: "18%", bottom: "4%", rotate: "-12deg", animationDelay: ".9s" } },
  { brand: "ionic", bg: "#3880ff", fg: "#fff", pos: { right: "20%", bottom: "2%", rotate: "10deg", animationDelay: "1.5s" } },
];

function StackCard() {
  const t = useTranslations("home.wd.stack");
  return (
    <Card label={t("label")} title={t("title")}>
      <div className="wd-stage min-h-[320px]" role="img" aria-label={t("aria")}>
        <span className="wd-ring size-[250px] bg-blob-a/8" style={{ animation: "wd-pulse 3.2s ease-in-out infinite .8s" }} aria-hidden />
        <span className="wd-ring size-[176px] bg-blob-a/20" style={{ animation: "wd-pulse 3.2s ease-in-out infinite .4s" }} aria-hidden />
        <span className="wd-ring size-[116px] bg-blob-a/40" aria-hidden />
        <span className="wd-core" aria-hidden>
          PL<span className="text-accent">.</span>
        </span>
        {TECH.map((x) => (
          <span key={x.brand} className="wd-tech" style={{ background: x.bg, color: x.fg, ...x.pos }} aria-hidden>
            <BrandIcon brand={x.brand} size={26} />
          </span>
        ))}
      </div>
    </Card>
  );
}

/* Design systems: a floating collage of tokens. ------------------------ */

function DesignCard() {
  const t = useTranslations("home.wd.design");
  return (
    <Card label={t("label")} title={t("title")} style={{ paddingBottom: 0 }}>
      <div className="wd-stage -mr-[30px] min-h-[300px] items-stretch max-nav:-mr-[22px]" role="img" aria-label={t("aria")}>
        <span className="wd-tile flex flex-col justify-end bg-accent p-3.5" style={{ left: 0, top: 46, width: "34%", height: 150, rotate: "-4deg" }}>
          <span className="label text-ink">#C46949</span>
        </span>
        <span
          className="wd-tile flex flex-col justify-between bg-white p-4"
          style={{ left: "30%", top: 0, width: "38%", height: 200, rotate: "3deg", animationDelay: ".8s" }}
        >
          <span className="label text-muted-foreground">Archivo 800</span>
          <span className="font-display text-[72px] font-extrabold leading-[0.9] tracking-[-0.04em]">Aa</span>
        </span>
        <span
          className="wd-tile flex items-end bg-blob-b p-3.5"
          style={{ left: "70%", top: 24, width: "40%", height: 120, rotate: "6deg", animationDelay: "1.6s" }}
        >
          <span className="inline-flex min-h-[34px] items-center rounded-full bg-ink px-3.5 text-xs font-semibold text-card">{t("cta")}</span>
        </span>
        <span
          className="wd-tile flex flex-col gap-2 bg-blob-c p-3.5"
          style={{ left: "6%", top: 214, width: "42%", height: 120, rotate: "2deg", animationDelay: "1.1s" }}
        >
          <span className="h-2.5 w-[70%] rounded bg-ink/20" />
          <span className="h-2.5 w-1/2 rounded bg-ink/20" />
          <span className="h-2.5 w-[60%] rounded bg-ink/20" />
        </span>
        <span
          className="wd-tile flex flex-col justify-between bg-ink p-4"
          style={{ left: "52%", top: 170, width: "50%", height: 150, rotate: "-3deg", animationDelay: ".3s" }}
        >
          <span className="label text-blob-a">{t("tokens")}</span>
          <span className="flex gap-1.5">
            {["bg-background", "bg-blob-a", "bg-blob-b", "bg-blob-c"].map((c) => (
              <span key={c} className={`size-[26px] rounded-full ${c}`} />
            ))}
          </span>
        </span>
      </div>
    </Card>
  );
}

/* Ways to work: project or team, one switch. -------------------------- */

function ModesCard() {
  const t = useTranslations("home.wd.modes");
  const [team, setTeam] = useState(false);
  const word = (on: boolean) => `font-display text-xl font-bold transition-colors ${on ? "text-accent-ink" : "text-muted-foreground"}`;
  return (
    <Card label={t("label")} title={t("title")} style={{ background: "linear-gradient(180deg, #f6e3d6 0%, var(--card) 60%)" }}>
      <div className="wd-stage min-h-[160px] flex-col gap-[18px]">
        <div className="flex items-center gap-[22px]">
          <span className={word(!team)} aria-hidden>
            {t("project")}
          </span>
          <button type="button" role="switch" aria-checked={team} aria-label={t("switch")} className="wd-switch" onClick={() => setTeam((v) => !v)}>
            <span className="wd-knob" style={{ left: team ? 63 : 5 }}>
              <Sparkle size={22} className="fill-accent text-accent" aria-hidden />
            </span>
          </button>
          <span className={word(team)} aria-hidden>
            {t("team")}
          </span>
        </div>
        <p role="status" className="m-0 max-w-[360px] text-center text-sm leading-relaxed text-muted-foreground">
          {team ? t("teamText") : t("projectText")}
        </p>
      </div>
    </Card>
  );
}
