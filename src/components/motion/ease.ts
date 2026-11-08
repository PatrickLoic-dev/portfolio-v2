/** Design-system ease: cubic-bezier(.2, .7, .2, 1). Media 600ms · UI 200–250ms. */
export const EASE = [0.2, 0.7, 0.2, 1] as const;
export const DURATION = { media: 0.6, ui: 0.25 } as const;
/** Reveal: fade + 24px rise, staggered 60ms. */
export const REVEAL_Y = 24;
export const STAGGER = 0.06;
