"use client";

import { Loader2 } from "lucide-react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useCallback, useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { EASE } from "@/components/motion/ease";
import { cn } from "@/lib/cn";

/** How long the "done" state stays before the button goes back to its label. */
const DONE_MS = 1600;

/**
 * Feedback for one button: call `ok()` after a successful action, `fail()` after an error.
 * Each call changes a key, which is what makes the button play its animation.
 */
export function useFeedback() {
  const [state, setState] = useState<{ done: number | null; failed: number | null }>({ done: null, failed: null });
  const ok = useCallback(() => setState({ done: Date.now(), failed: null }), []);
  const fail = useCallback(() => setState({ done: null, failed: Date.now() }), []);
  return { done: state.done, failed: state.failed, ok, fail };
}

/** A check mark that draws itself. */
function DrawnCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="flex-none">
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: EASE }}
      />
      <motion.path
        d="M7.5 12.5l3 3 6-6.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.25, ease: EASE }}
      />
    </svg>
  );
}

type Props = Omit<ComponentProps<"button">, "children"> & {
  children: ReactNode;
  /** The action is running: spinner + `pendingLabel`. */
  pending?: boolean;
  /** Changes after each success (see useFeedback): green flash + drawn check + `doneLabel`. */
  done?: number | string | null;
  /** Changes after each failure: the button shakes. */
  failed?: number | string | null;
  pendingLabel?: ReactNode;
  doneLabel?: ReactNode;
};

/**
 * Button with a visible life cycle: label → spinner while the action runs →
 * green with a check that draws itself once validated → back to the label.
 * A failure makes it shake. The width never jumps between states.
 */
export function ActionButton({
  children,
  pending,
  done,
  failed,
  pendingLabel = "Enregistrement…",
  doneLabel = "Enregistré",
  className,
  disabled,
  ...rest
}: Props) {
  const [showDone, setShowDone] = useState(false);
  const [lastDone, setLastDone] = useState(done);
  const shake = useAnimationControls();

  // A new success key: play the "done" state (adjusted during render, reset by a timer).
  if (done !== lastDone) {
    setLastDone(done);
    if (done != null) setShowDone(true);
  }
  useEffect(() => {
    if (!showDone) return;
    const id = window.setTimeout(() => setShowDone(false), DONE_MS);
    return () => window.clearTimeout(id);
  }, [showDone, done]);

  useEffect(() => {
    if (failed == null) return;
    shake.start({ x: [0, -7, 7, -5, 5, -2, 0], transition: { duration: 0.45, ease: "easeOut" } });
  }, [failed, shake]);

  const phase = pending ? "pending" : showDone ? "done" : "idle";

  return (
    <motion.button
      animate={shake}
      {...(rest as ComponentProps<typeof motion.button>)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(
        "relative shrink-0 overflow-hidden transition-[background-color,color,border-color,transform] duration-300 active:scale-[0.97]",
        className,
        phase === "done" && "!border-success !bg-success !text-white",
        pending && "cursor-progress !opacity-100",
      )}
    >
      {/* A soft glow that sweeps once on success. */}
      <AnimatePresence>
        {phase === "done" && (
          <motion.span
            key={String(done)}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white/35"
            initial={{ scale: 0.2, opacity: 0.7 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          />
        )}
      </AnimatePresence>
      {/* Invisible copies of every state: the button always has the width of the longest one. */}
      <span aria-hidden className="invisible grid">
        {[
          children,
          <>
            <span className="size-4 flex-none" />
            {pendingLabel}
          </>,
          <>
            <span className="size-4 flex-none" />
            {doneLabel}
          </>,
        ].map((c, i) => (
          <span key={i} className="col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap">
            {c}
          </span>
        ))}
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={phase}
            className="relative inline-flex items-center justify-center gap-2 whitespace-nowrap"
            initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            {phase === "pending" ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden />
                {pendingLabel}
              </>
            ) : phase === "done" ? (
              <>
                <DrawnCheck />
                {doneLabel}
              </>
            ) : (
              children
            )}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
