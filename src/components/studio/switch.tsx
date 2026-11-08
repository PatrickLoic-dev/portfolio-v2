"use client";

import { motion } from "motion/react";

/** Pill on/off switch from the design (role="switch"). */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-none cursor-pointer rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-ink" : "bg-ink/25"}`}
    >
      <motion.span
        className="absolute top-[3px] size-[18px] rounded-full bg-card shadow-sm"
        animate={{ left: checked ? 23 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  );
}
