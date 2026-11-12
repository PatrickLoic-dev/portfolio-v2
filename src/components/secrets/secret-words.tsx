"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

// Loaded only once a secret word is typed: the site stays as light as before.
const Noclip = dynamic(() => import("./noclip").then((m) => m.Noclip), { ssr: false });
const WordHunt = dynamic(() => import("./word-hunt").then((m) => m.WordHunt), { ssr: false });

type Secret = "noclip" | "hunt";

/** Typed word → what it opens. */
const WORDS: Record<string, Secret> = { noclip: "noclip", chasse: "hunt", hunt: "hunt" };
const LONGEST = Math.max(...Object.keys(WORDS).map((w) => w.length));

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/**
 * Listens for secret words typed anywhere on the site (never inside a form
 * field), says so with a small prompt, then opens the matching easter egg.
 */
export function SecretWords() {
  const t = useTranslations("secrets");
  const buffer = useRef("");
  const [prompt, setPrompt] = useState<{ word: string; id: number } | null>(null);
  const [open, setOpen] = useState<Secret | null>(null);

  useEffect(() => {
    let timer = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key.length !== 1) return;
      buffer.current = (buffer.current + e.key.toLowerCase()).slice(-LONGEST);
      const word = Object.keys(WORDS).find((w) => buffer.current.endsWith(w));
      if (!word) return;
      buffer.current = "";
      setPrompt({ word, id: Date.now() });
      window.clearTimeout(timer);
      // Let the prompt land, then open the egg.
      timer = window.setTimeout(() => setOpen(WORDS[word]), 900);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!prompt) return;
    const id = window.setTimeout(() => setPrompt(null), 2400);
    return () => window.clearTimeout(id);
  }, [prompt]);

  return (
    <>
      <AnimatePresence>
        {prompt && (
          <motion.div
            key={prompt.id}
            role="status"
            initial={{ y: -80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="pointer-events-none fixed left-1/2 top-5 z-[95] flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink py-2.5 pl-3 pr-5 text-background shadow-[0_18px_40px_-18px_rgb(0_0_0/0.6)]"
          >
            <motion.span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-accent font-mono text-sm"
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 500, damping: 18 }}
            >
              ✦
            </motion.span>
            <span className="flex flex-col leading-tight">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-blob-b">{t("unlocked")}</span>
              <span className="text-sm font-semibold">
                « {prompt.word} »
              </span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {open === "noclip" && <Noclip onClose={() => setOpen(null)} />}
      {open === "hunt" && <WordHunt onClose={() => setOpen(null)} />}
    </>
  );
}
