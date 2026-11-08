"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { EASE } from "@/components/motion/ease";

type Toast = { id: number; message: string; tone: "ok" | "error"; undo?: () => void };
type Notify = (message: string, opts?: { undo?: () => void; tone?: "ok" | "error" }) => void;

const ToastContext = createContext<Notify>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

/** Bottom-right pill toast from the design, with an optional "Annuler". */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback<Notify>((message, opts) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone: opts?.tone ?? "ok", undo: opts?.undo });
    timer.current = setTimeout(() => setToast(null), opts?.undo ? 6000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`pointer-events-auto flex items-center gap-3 rounded-full py-2.5 pl-5 text-background shadow-[0_12px_32px_rgb(37_30_25/0.2)] ${
                toast.tone === "error" ? "bg-danger" : "bg-ink"
              } ${toast.undo ? "pr-2.5" : "pr-5"}`}
            >
              {toast.tone === "ok" && <Check size={16} className="text-blob-b" aria-hidden />}
              <span className="text-sm font-semibold">{toast.message}</span>
              {toast.undo && (
                <button
                  type="button"
                  className="btn min-h-9 bg-background px-3.5 text-sm text-ink"
                  onClick={() => {
                    toast.undo?.();
                    setToast(null);
                  }}
                >
                  Annuler
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
