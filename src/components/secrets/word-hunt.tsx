"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

const TIME = 120; // seconds
const COUNT = 6; // words to find
const RANKS = ["D", "C", "B", "A", "S"] as const;
const DECAY = 0.11; // combo gauge lost per second
const FILL = { 1: 0.45, 2: 0.7, 3: 1 } as const; // gauge gained, by how well hidden the word is

type Level = 1 | 2 | 3;
type Target = { key: string; word: string; level: Level; range: Range; found: boolean };

const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const LETTER = /\p{L}/u;

/* ------------------------------------------------------------------ */
/* Page reading                                                        */
/* ------------------------------------------------------------------ */

/** How well a word is hidden: big titles are easy, small print and far down the page are hard. */
function levelOf(el: Element): Level {
  if (el.closest("h1, h2, .display")) return 1;
  const style = getComputedStyle(el);
  const size = parseFloat(style.fontSize);
  const far = el.getBoundingClientRect().top + window.scrollY > window.innerHeight * 2.2;
  if (size < 14 || el.closest("footer, .label, figcaption, small, dd, dt") || style.fontFamily.includes("Mono")) return 3;
  return far ? 3 : 2;
}

/** Picks hidden words from the page: unique on the page, 5+ letters, visible, a mix of difficulties. */
function pickTargets(): Target[] {
  const root = document.getElementById("content");
  if (!root) return [];
  const seen = new Map<string, { count: number; node: Text; start: number; word: string }>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const el = n.parentElement;
      if (!el || el.closest("[aria-hidden='true'], script, style, button, input, textarea, svg, .sr-only, [data-hunt-ui]")) return NodeFilter.FILTER_REJECT;
      return n.textContent && n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    for (const m of n.data.matchAll(/\p{L}{5,12}/gu)) {
      const key = norm(m[0]);
      const prev = seen.get(key);
      if (prev) prev.count++;
      else seen.set(key, { count: 1, node: n, start: m.index!, word: m[0] });
    }
  }

  const byLevel: Record<Level, Target[]> = { 1: [], 2: [], 3: [] };
  for (const [key, v] of seen) {
    if (v.count !== 1) continue;
    const range = document.createRange();
    range.setStart(v.node, v.start);
    range.setEnd(v.node, v.start + v.word.length);
    const rect = range.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const el = v.node.parentElement!;
    if (getComputedStyle(el).visibility === "hidden") continue;
    const level = levelOf(el);
    byLevel[level].push({ key, word: v.word, level, range, found: false });
  }

  const shuffle = <T,>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const plan: Level[] = [1, 2, 2, 3, 3, 3];
  const out: Target[] = [];
  const pools = { 1: shuffle(byLevel[1]), 2: shuffle(byLevel[2]), 3: shuffle(byLevel[3]) };
  for (const lv of plan) {
    const next = pools[lv].shift() ?? pools[2].shift() ?? pools[3].shift() ?? pools[1].shift();
    if (next) out.push(next);
  }
  return out.slice(0, COUNT);
}

/** The word under a click, as a text range (works in Chrome, Safari and Firefox). */
function wordAt(x: number, y: number): { range: Range; text: string } | null {
  let node: Node | null = null;
  let offset = 0;
  const d = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  if (d.caretPositionFromPoint) {
    const p = d.caretPositionFromPoint(x, y);
    if (p) ({ offsetNode: node, offset } = p);
  } else if (d.caretRangeFromPoint) {
    const r = d.caretRangeFromPoint(x, y);
    if (r) {
      node = r.startContainer;
      offset = r.startOffset;
    }
  }
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const text = (node as Text).data;
  let a = offset;
  let b = offset;
  while (a > 0 && LETTER.test(text[a - 1])) a--;
  while (b < text.length && LETTER.test(text[b])) b++;
  if (b - a < 2) return null;
  const range = document.createRange();
  range.setStart(node, a);
  range.setEnd(node, b);
  return { range, text: text.slice(a, b) };
}

/* ------------------------------------------------------------------ */
/* Highlights on the page (no change to the page's own markup)          */
/* ------------------------------------------------------------------ */

function Highlights({ targets, tick }: { targets: Target[]; tick: number }) {
  const [boxes, setBoxes] = useState<{ key: string; x: number; y: number; w: number; h: number; level: Level; reveal: boolean }[]>([]);
  useLayoutEffect(() => {
    const measure = () =>
      setBoxes(
        targets.flatMap((tg) =>
          tg.found || tg.key.startsWith("!")
            ? [...tg.range.getClientRects()].map((r) => ({
                key: tg.key,
                x: r.left + window.scrollX,
                y: r.top + window.scrollY,
                w: r.width,
                h: r.height,
                level: tg.level,
                reveal: !tg.found,
              }))
            : [],
        ),
      );
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [targets, tick]);

  return (
    <div data-hunt-ui aria-hidden className="pointer-events-none absolute left-0 top-0 z-[55]">
      {boxes.map((b, i) => (
        <motion.span
          key={`${b.key}-${i}`}
          className={cn("absolute rounded-[4px] mix-blend-multiply", b.reveal ? "bg-ink/15 outline-2 outline-dashed outline-ink/40" : "bg-accent/35")}
          style={{ left: b.x - 3, top: b.y - 1, width: b.w + 6, height: b.h + 2 }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Game                                                                */
/* ------------------------------------------------------------------ */

type Phase = "timer" | "list" | "play" | "won" | "lost";

/**
 * Easter egg "chasse": find the hidden words on the current page before time
 * runs out. Quick finds fill the combo gauge and climb D → C → B → A → S; an
 * empty gauge drops a rank. Clicking a word finds it (links are paused meanwhile).
 */
export function WordHunt({ onClose }: { onClose: () => void }) {
  const t = useTranslations("secrets");
  const [phase, setPhase] = useState<Phase>("timer");
  // The page is already rendered when this mounts (it's loaded on demand), so words are picked right away.
  const [targets, setTargets] = useState<Target[]>(() => pickTargets());
  // Mirror of `targets` for the click handler (updated wherever targets change).
  const targetsRef = useRef(targets);
  const [left, setLeft] = useState(TIME);
  const [rank, setRank] = useState(0);
  const [best, setBest] = useState(0);
  const [gauge, setGauge] = useState(0);
  const [tick, setTick] = useState(0);
  const [pops, setPops] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [miss, setMiss] = useState(0);
  const state = useRef({ rank: 0, gauge: 0, last: 0 });

  const start = useCallback(() => {
    const fresh = pickTargets();
    targetsRef.current = fresh;
    setTargets(fresh);
    setMiss(0);
    setLeft(TIME);
    setRank(0);
    setBest(0);
    setGauge(0);
    state.current = { rank: 0, gauge: 0, last: performance.now() };
    setPhase("timer");
  }, []);

  // Intro: the timer pops in the middle, then the word list, then both fly to their corners.
  useEffect(() => {
    if (phase === "timer") {
      const id = window.setTimeout(() => setPhase("list"), 900);
      return () => window.clearTimeout(id);
    }
    if (phase === "list") {
      const id = window.setTimeout(() => setPhase("play"), 1300);
      return () => window.clearTimeout(id);
    }
  }, [phase]);

  // Clock + combo gauge decay.
  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0;
    let prev = performance.now();
    const t0 = prev;
    const startLeft = left;
    const loop = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      const remaining = Math.max(0, startLeft - (now - t0) / 1000);
      setLeft(remaining);
      const s = state.current;
      s.gauge -= DECAY * dt;
      if (s.gauge < 0) {
        if (s.rank > 0) {
          s.rank -= 1;
          s.gauge = 0.6;
          setRank(s.rank);
        } else s.gauge = 0;
      }
      setGauge(s.gauge);
      if (remaining <= 0) {
        setPhase("lost");
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Clicks: a hidden word → found; links and buttons on the page are paused while playing.
  useEffect(() => {
    if (phase !== "play") return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest("[data-hunt-ui]")) return;
      const hit = wordAt(e.clientX, e.clientY);
      const interactive = target?.closest("a, button, [role='tab'], label");
      if (interactive || hit) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!hit) return;
      const key = norm(hit.text);
      const list = targetsRef.current;
      const tg = list.find((x) => x.key === key && !x.found);
      if (!tg) {
        setMiss((m) => m + 1);
        return;
      }
      {
        // Gauge: the better hidden and the quicker, the more it fills.
        const s = state.current;
        const since = (performance.now() - s.last) / 1000;
        s.last = performance.now();
        s.gauge += FILL[tg.level] + (since < 8 ? 0.25 : since < 16 ? 0.1 : 0);
        while (s.gauge >= 1 && s.rank < RANKS.length - 1) {
          s.gauge -= 1;
          s.rank += 1;
        }
        if (s.rank === RANKS.length - 1) s.gauge = Math.min(1, s.gauge);
        setRank(s.rank);
        setBest((b) => Math.max(b, s.rank));
        setGauge(s.gauge);
        setPops((p) => [...p, { id: Date.now(), x: e.clientX, y: e.clientY, text: `+${tg.level === 3 ? "★" : ""}${tg.word}` }]);
        const next = list.map((x) => (x === tg ? { ...x, range: hit.range, found: true } : x));
        targetsRef.current = next;
        setTargets(next);
        if (next.every((x) => x.found)) window.setTimeout(() => setPhase("won"), 500);
      }
      setTick((n) => n + 1);
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [phase]);

  // When time is up, show where the missing words were hiding.
  const shown = phase === "lost" ? targets.map((x) => (x.found ? x : { ...x, key: `!${x.key}` })) : targets;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const found = targets.filter((x) => x.found).length;
  const mm = Math.floor(left / 60);
  const ss = Math.floor(left % 60);
  const hurry = phase === "play" && left <= 15;
  const corner = phase === "play" || phase === "won" || phase === "lost";

  return (
    <>
      <Highlights targets={shown} tick={tick} />

      {/* HUD: centred during the intro, then timer top-left and list top-right */}
      <div
        data-hunt-ui
        className={cn(
          "pointer-events-none fixed inset-0 z-[60] flex p-[clamp(10px,2vw,24px)]",
          corner ? "flex-row items-start justify-between" : "flex-col items-center justify-center gap-4",
        )}
      >
        <motion.div layout transition={{ type: "spring", stiffness: 180, damping: 24 }} className="pointer-events-auto flex flex-col items-start gap-2">
          <motion.div
            layout
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
            className={cn("rounded-2xl bg-ink px-4 py-2.5 text-background shadow-[0_18px_40px_-18px_rgb(0_0_0/0.6)] ring-1 ring-background/25", !corner && "px-7 py-5")}
          >
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-blob-b">{t("huntTimer")}</span>
            <motion.span
              layout
              className={cn("display block tabular-nums", corner ? "text-[34px]" : "text-[72px]", hurry && "text-blob-a")}
              animate={hurry ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={hurry ? { duration: 1, repeat: Infinity } : undefined}
            >
              {mm}:{String(ss).padStart(2, "0")}
            </motion.span>
          </motion.div>

          {/* Combo rank + gauge, under the timer */}
          {corner && (
            <motion.div layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex w-[124px] flex-col gap-1.5 rounded-2xl bg-ink p-3 text-background ring-1 ring-background/25">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-background/60">{t("huntCombo")}</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={rank}
                  className={cn("display block text-[56px] leading-none", rank >= 3 ? "text-accent" : rank === 2 ? "text-blob-a" : "text-background")}
                  initial={{ scale: 1.9, rotate: -10, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0, y: 12 }}
                  transition={{ type: "spring", stiffness: 420, damping: 16 }}
                >
                  {RANKS[rank]}
                </motion.span>
              </AnimatePresence>
              <span className="block h-1.5 overflow-hidden rounded-full bg-background/15" aria-label={t("huntGauge")}>
                <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(0, Math.min(1, gauge)) * 100}%` }} />
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Word list */}
        <AnimatePresence>
          {phase !== "timer" && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
              className="pointer-events-auto w-[min(46vw,220px)] rounded-2xl border-2 border-ink bg-card p-3.5 text-ink shadow-[0_18px_40px_-18px_rgb(37_30_25/0.45)]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t("huntWords")} · {found}/{targets.length}
                </span>
                <button type="button" onClick={onClose} className="inline-flex size-7 items-center justify-center rounded-full hover:bg-muted" aria-label={t("close")}>
                  <X size={14} aria-hidden />
                </button>
              </div>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {targets.map((w) => (
                  <li key={w.key} className="flex items-center justify-between gap-2 text-sm">
                    <span className="relative font-semibold">
                      {w.word}
                      <motion.span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-[2px] w-full origin-left bg-accent"
                        initial={false}
                        animate={{ scaleX: w.found ? 1 : 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <span className="sr-only">{w.found ? ` (${t("huntFound")})` : ""}</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground" title={t("huntLevel")}>
                      {"●".repeat(w.level)}
                      {"○".repeat(3 - w.level)}
                    </span>
                  </li>
                ))}
              </ul>
              {phase === "play" && miss > 0 && <span className="mt-2 block text-[11px] text-muted-foreground">{t("huntMiss", { n: miss })}</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* "+word" pops where a word was found */}
      <div data-hunt-ui className="pointer-events-none fixed inset-0 z-[61]">
        <AnimatePresence>
          {pops.map((p) => (
            <motion.span
              key={p.id}
              className="display absolute text-[22px] text-accent"
              style={{ left: p.x, top: p.y }}
              initial={{ y: 0, opacity: 1, scale: 0.6 }}
              animate={{ y: -60, opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => setPops((all) => all.filter((x) => x.id !== p.id))}
            >
              {p.text}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* End screens */}
      <AnimatePresence>
        {(phase === "won" || phase === "lost") && (
          <motion.div
            data-hunt-ui
            className="fixed inset-x-0 bottom-[clamp(16px,4vw,40px)] z-[62] flex justify-center px-4"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="flex w-[min(100%,460px)] flex-col gap-4 rounded-[24px] bg-ink p-6 text-background shadow-[0_24px_60px_-24px_rgb(0_0_0/0.7)]">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-blob-b">{phase === "won" ? t("huntWonEyebrow") : t("huntLostEyebrow")}</span>
              <span className="display text-[clamp(32px,6vw,48px)]">
                {phase === "won" ? t("huntWon") : t("huntLost")}
                <span className="text-accent">.</span>
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  [t("huntStatWords"), `${found}/${targets.length}`],
                  [t("huntStatRank"), RANKS[best]],
                  [t("huntStatTime"), `${Math.floor((TIME - left) / 60)}:${String(Math.floor((TIME - left) % 60)).padStart(2, "0")}`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-background/8 p-2.5">
                    <span className="display block text-[28px]">{v}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-background/60">{k}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-light min-h-11 text-sm" onClick={start}>
                  {t("huntAgain")}
                </button>
                <button type="button" className="btn min-h-11 border border-background/25 text-sm text-background hover:bg-background/10" onClick={onClose}>
                  {t("close")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
