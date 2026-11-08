"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE } from "@/components/motion/ease";

/** Soft page-enter transition, re-run on every navigation. */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, ease: EASE }}>
      {children}
    </motion.div>
  );
}
