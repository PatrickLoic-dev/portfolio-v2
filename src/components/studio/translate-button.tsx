"use client";

import { Languages } from "lucide-react";
import { useState, useTransition } from "react";
import { translate } from "@/app/studio/ai-actions";
import { ActionButton, useFeedback } from "@/components/action-button";
import { useFeatures } from "@/components/studio/features";
import { useToast } from "@/components/studio/toast";
import { cn } from "@/lib/cn";

type Lang = "fr" | "en";
type Fields = Record<string, { fr: string; en: string }>;

const NAME = { fr: "français", en: "anglais" } as const;

/**
 * "Traduire depuis le français / l'anglais" with Claude.
 * Fills the other language's fields; asks before replacing text already there.
 */
export function TranslateButton({
  fields,
  onTranslated,
  context,
  only,
  className,
}: {
  /** Show a single button, translating from this language. */
  only?: Lang;
  fields: Fields;
  onTranslated: (to: Lang, out: Record<string, string | undefined>) => void;
  context: string;
  className?: string;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const { ai } = useFeatures();
  const fb = useFeedback();
  const [runningFrom, setRunningFrom] = useState<Lang | null>(null);
  const filled = (l: Lang) => Object.values(fields).some((f) => f[l].trim());

  const run = (from: Lang) => {
    const to: Lang = from === "fr" ? "en" : "fr";
    const source = Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, f[from]]));
    if (filled(to) && !window.confirm(`Remplacer le texte ${to === "en" ? "anglais" : "français"} déjà saisi par la traduction ?`)) return;
    setRunningFrom(from);
    start(async () => {
      const res = await translate({ from, to, context, fields: source });
      if (!res.ok) {
        fb.fail();
        return toast(res.error, { tone: "error" });
      }
      fb.ok();
      onTranslated(to, res.data ?? {});
      toast(`Traduit en ${NAME[to]} : relisez avant d'enregistrer`);
    });
  };

  // No ANTHROPIC_API_KEY: nothing to show.
  if (!ai) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} aria-busy={pending}>
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
        <Languages size={15} aria-hidden />
        Claude
      </span>
      {(only ? [only] : (["fr", "en"] as const)).map((from) => (
        <ActionButton
          key={from}
          type="button"
          className="btn btn-ghost min-h-10 px-3.5 text-[13px]"
          disabled={(pending && runningFrom !== from) || !filled(from)}
          pending={pending && runningFrom === from}
          pendingLabel="Traduction…"
          doneLabel="Traduit"
          done={runningFrom === from ? fb.done : null}
          failed={runningFrom === from ? fb.failed : null}
          title={filled(from) ? undefined : `Rien à traduire en ${NAME[from]}`}
          onClick={() => run(from)}
        >
          {from === "fr" ? "Traduire depuis le français" : "Traduire depuis l'anglais"}
        </ActionButton>
      ))}
    </div>
  );
}
