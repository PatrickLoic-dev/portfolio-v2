"use client";

import { ArrowRight, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { ActionButton, useFeedback } from "@/components/action-button";
import { sendContact, type FormState } from "@/app/actions";
import { EASE } from "@/components/motion/ease";
import { SplitHeadline } from "@/components/motion/split-headline";
import { Link } from "@/i18n/navigation";

const kinds = ["web", "mobile", "showcase", "consulting", "fulltime"] as const;

/** Card wrapper — "Send another" remounts the panel with a fresh action state. */
export function ContactForm() {
  const [round, setRound] = useState(0);
  return (
    <div className="hairline min-w-0 flex-[1_1_480px] rounded-[28px] border bg-card p-[clamp(24px,4vw,48px)]">
      <ContactPanel key={round} onReset={() => setRound((r) => r + 1)} />
    </div>
  );
}

function ContactPanel({ onReset }: { onReset: () => void }) {
  const t = useTranslations("contact");
  const [kind, setKind] = useState<(typeof kinds)[number]>("web");
  const [state, action, pending] = useActionState<FormState, FormData>(sendContact, { status: "idle" });
  const fb = useFeedback();
  const [shown, setShown] = useState(state);
  const [revealed, setRevealed] = useState(false);

  // A new result: play the button (check or shake) before swapping to the "sent" panel.
  if (state !== shown) {
    setShown(state);
    setRevealed(false);
    if (state.status === "ok") fb.ok();
    if (state.status === "error") fb.fail();
  }
  useEffect(() => {
    if (state.status !== "ok") return;
    const id = window.setTimeout(() => setRevealed(true), 900);
    return () => window.clearTimeout(id);
  }, [state]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state.status === "ok" && revealed ? (
        <motion.div
          key="sent"
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex min-h-[520px] flex-col items-start justify-center gap-6"
        >
          <motion.span
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="flex size-16 items-center justify-center rounded-full bg-blob-b"
          >
            <Check size={28} aria-hidden />
          </motion.span>
          <SplitHeadline as="h2" immediate text={t("sentTitle")} accent="." className="text-[64px]" />
          <p className="m-0 max-w-[420px] text-[17px] leading-relaxed text-muted-foreground">{t("sentBody")}</p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/work" className="btn btn-primary">
              {t("seeWork")}
            </Link>
            <button type="button" className="btn btn-ghost" onClick={onReset}>
              {t("again")}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.form key="form" action={action} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <span className="label text-accent-ink">{t("formEyebrow")}</span>
            <h2 className="heading text-[32px] tracking-[-0.02em]">{t("formTitle")}</h2>
          </div>

          <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
            <legend className="mb-3 p-0 text-sm font-semibold">{t("need")}</legend>
            <div className="flex flex-wrap gap-2">
              {kinds.map((k) => (
                <button key={k} type="button" className="pill" aria-pressed={kind === k} onClick={() => setKind(k)}>
                  {t(`kinds.${k}`)}
                </button>
              ))}
            </div>
            <input type="hidden" name="kind" value={t(`kinds.${kind}`)} />
          </fieldset>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold" htmlFor="c-name">
                {t("name")}
              </label>
              <input className="field" id="c-name" name="name" type="text" autoComplete="name" placeholder={t("namePlaceholder")} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold" htmlFor="c-email">
                {t("yourEmail")}
              </label>
              <input className="field" id="c-email" name="email" type="email" autoComplete="email" placeholder={t("emailPlaceholder")} required />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold" htmlFor="c-msg">
              {t("message")}
            </label>
            <textarea className="field min-h-40 resize-y leading-normal" id="c-msg" name="message" rows={6} placeholder={t("messagePlaceholder")} />
          </div>
          {/* Honeypot — hidden from people, filled by bots */}
          <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

          {state.status === "error" && (
            <p role="alert" className="m-0 rounded-2xl bg-blob-a/40 px-4 py-3 text-sm font-medium">
              {t("error")}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">{t("reply")}</span>
            <ActionButton
              type="submit"
              className="btn btn-primary disabled:opacity-60"
              pending={pending}
              pendingLabel={t("sending")}
              doneLabel={t("sentShort")}
              done={fb.done}
              failed={fb.failed}
            >
              {t("send")}
              <ArrowRight size={16} aria-hidden />
            </ActionButton>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
