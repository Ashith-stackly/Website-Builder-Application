/**
 * Shared Framer Motion variants for Stackly app surfaces.
 *
 * Usage:
 *   <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit" />
 *
 * For lists, wrap with a parent using `staggerContainer` and mark children
 * with any item variant - Framer propagates the `animate` prop automatically.
 */

import type { Variants, Transition } from "framer-motion";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

/* ─── Easing + spring presets (single source of truth) ─────────────────── */

/** Premium "out-expo" style ease for entrances. */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
/** Snappy ease for exits / dismissals. */
export const easeInSoft = [0.4, 0, 1, 1] as const;

/** Springs — reuse instead of re-declaring transitions everywhere. */
export const spring = {
  /** Default UI spring — panels, cards, layout shifts. */
  soft: { type: "spring", stiffness: 320, damping: 32, mass: 0.9 } as Transition,
  /** Snappy — buttons, toggles, small controls. */
  snappy: { type: "spring", stiffness: 480, damping: 30 } as Transition,
  /** Bouncy — playful accents (use sparingly). */
  bouncy: { type: "spring", stiffness: 500, damping: 22 } as Transition,
  /** Gentle — large surfaces / drawers. */
  gentle: { type: "spring", stiffness: 210, damping: 26 } as Transition,
} as const;

/** Duration-based transition presets. */
export const duration = {
  fast: { duration: 0.15, ease: EASE } as Transition,
  base: { duration: 0.22, ease: EASE } as Transition,
  slow: { duration: 0.36, ease: easeOutExpo } as Transition,
} as const;

/** Generic fade + slide-up. Used for panels, modals, toasts. */
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.22, ease: EASE } },
  exit:    { opacity: 0, y: 8,  transition: { duration: 0.14 } },
};

/** Generic fade + slide-down. Used for marketing headings and dropdown reveals. */
export const fadeDown: Variants = {
  hidden:  { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0,   transition: { duration: 0.22, ease: EASE } },
  exit:    { opacity: 0, y: -8,  transition: { duration: 0.14 } },
};

/** Pop-in scale. Used for dropdowns, tooltips, context menus. */
export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1,    transition: { duration: 0.18, ease: EASE } },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.12 } },
};

/** Standard slide-in from the right for paired marketing panels. */
export const slideIn: Variants = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.22, ease: EASE } },
  exit:    { opacity: 0, x: 16, transition: { duration: 0.15 } },
};

/** Slide from the right. Used for side panels. */
export const slideRight: Variants = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.22, ease: EASE } },
  exit:    { opacity: 0, x: 16, transition: { duration: 0.15 } },
};

/** Tiny float-up for overlaid toolbars / badges. */
export const floatUp: Variants = {
  hidden:  { opacity: 0, y: 4,  scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.15, ease: EASE } },
  exit:    { opacity: 0, y: 2,  scale: 0.98, transition: { duration: 0.09 } },
};

/** Canvas block mount / unmount. */
export const canvasItem: Variants = {
  hidden:  { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.2,  ease: EASE } },
  exit:    { opacity: 0, scale: 0.96,        transition: { duration: 0.15 } },
};

/** Parent container for staggered children. */
export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Individual stagger child - combine with staggerContainer on parent. */
export const staggerChild: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: EASE } },
};

/** Horizontal accordion open/close - set `custom` to target height. */
export const expandHeight: Variants = {
  hidden:  { height: 0, opacity: 0, overflow: "hidden" },
  visible: { height: "auto", opacity: 1, overflow: "hidden", transition: { duration: 0.22, ease: EASE } },
  exit:    { height: 0, opacity: 0, overflow: "hidden", transition: { duration: 0.16 } },
};

/* ─── App-shell / dashboard additions ──────────────────────────────────── */

/** Faster stagger for dense grids (stat tiles, project cards). */
export const gridContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};

/** Card entrance — pairs with gridContainer. */
export const cardItem: Variants = {
  hidden:  { opacity: 0, y: 14, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring.soft },
};

/** Section reveal on scroll (whileInView). */
export const revealSection: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutExpo } },
};

/** Left drawer / sidebar mobile slide. */
export const drawerLeft: Variants = {
  hidden:  { x: "-100%", transition: { duration: 0.2, ease: easeInSoft } },
  visible: { x: 0, transition: spring.gentle },
  exit:    { x: "-100%", transition: { duration: 0.2, ease: easeInSoft } },
};

/** Right drawer (activity / help center). */
export const drawerRight: Variants = {
  hidden:  { x: "100%", transition: { duration: 0.2, ease: easeInSoft } },
  visible: { x: 0, transition: spring.gentle },
  exit:    { x: "100%", transition: { duration: 0.2, ease: easeInSoft } },
};

/** Backdrop for modals / drawers / command palette. */
export const backdrop: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

/** Command palette / modal panel. */
export const modalPanel: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: spring.soft },
  exit:    { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.14 } },
};

/** Reusable hover/tap props for interactive tiles/buttons (lift). */
export const hoverLift = {
  whileHover: { y: -3, transition: spring.snappy },
  whileTap: { scale: 0.97, transition: spring.snappy },
} as const;

/** Subtle press-only feedback for icon buttons. */
export const pressable = {
  whileHover: { scale: 1.06, transition: spring.snappy },
  whileTap: { scale: 0.92, transition: spring.snappy },
} as const;

/** Number/counter fade for animated metrics. */
export const counterItem: Variants = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOutExpo } },
};
