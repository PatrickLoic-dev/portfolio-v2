"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { subscribe, type FormState } from "@/app/actions";
import { EASE } from "@/components/motion/ease";

export function NewsletterForm() {
  const t = useTranslations("blog");
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, { status: "idle" });

  return (
    <div className="max-w-[520px] flex-[1_1_420px]">
      <AnimatePresence mode="wait" initial={false}>
        {state.status === "ok" ? (
          <motion.div
            key="ok"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex items-center gap-3.5 rounded-full bg-background/8 px-[22px] py-[18px]"
          >
            <Check size={22} className="text-blob-b" aria-hidden />
            <span className="font-semibold">{t("subscribed")}</span>
          </motion.div>
        ) : (
          <motion.form key="form" action={action} exit={{ opacity: 0 }} className="flex flex-wrap gap-2.5">
            <label htmlFor="nl-email" className="sr-only">
              {t("newsletterEmail")}
            </label>
            <input
              id="nl-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              className="min-h-[52px] flex-[1_1_240px] rounded-full border border-background/25 bg-transparent px-5 text-base text-background outline-none placeholder:text-background/60 focus:border-background"
            />
            <button type="submit" className="btn btn-light" disabled={pending}>
              {t("subscribe")}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
