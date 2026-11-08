"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";
import { DURATION, EASE, REVEAL_Y, STAGGER } from "./ease";

type Tag = "div" | "section" | "article" | "li" | "ul" | "ol" | "span" | "p" | "header" | "figure" | "dl" | "nav" | "aside";

type RevealProps = HTMLMotionProps<"div"> & {
  as?: Tag;
  delay?: number;
  y?: number;
};

const VIEWPORT = { once: true, margin: "0px 0px -8% 0px" } as const;

/** Fade + rise when scrolled into view. */
export function Reveal({ as = "div", delay = 0, y = REVEAL_Y, children, ...rest }: RevealProps) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.media, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER } },
};

const item: Variants = {
  hidden: { opacity: 0, y: REVEAL_Y },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.media, ease: EASE } },
};

type StaggerProps = HTMLMotionProps<"div"> & { as?: Tag; delay?: number };

/** Parent that staggers its <StaggerItem> children by 60ms. */
export function Stagger({ as = "div", delay = 0, children, ...rest }: StaggerProps) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      variants={delay ? { hidden: {}, show: { transition: { staggerChildren: STAGGER, delayChildren: delay } } } : container}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({ as = "div", children, ...rest }: HTMLMotionProps<"div"> & { as?: Tag }) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp variants={item} {...rest}>
      {children}
    </Comp>
  );
}
