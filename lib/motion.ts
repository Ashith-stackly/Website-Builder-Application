/**
 * Shared Framer Motion variants for the builder.
 *
 * Usage:
 *   <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit" />
 *
 * For lists, wrap with a parent using `staggerContainer` and mark children
 * with any item variant — Framer propagates the `animate` prop automatically.
 */

import type { Variants } from "framer-motion";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

/** Generic fade + slide-up. Used for panels, modals, toasts. */
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.22, ease: EASE } },
  exit:    { opacity: 0, y: 8,  transition: { duration: 0.14 } },
};

/** Pop-in scale. Used for dropdowns, tooltips, context menus. */
export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1,    transition: { duration: 0.18, ease: EASE } },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.12 } },
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

/** Individual stagger child — combine with staggerContainer on parent. */
export const staggerChild: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: EASE } },
};

/** Horizontal accordion open/close — set `custom` to target height. */
export const expandHeight: Variants = {
  hidden:  { height: 0, opacity: 0, overflow: "hidden" },
  visible: { height: "auto", opacity: 1, overflow: "hidden", transition: { duration: 0.22, ease: EASE } },
  exit:    { height: 0, opacity: 0, overflow: "hidden", transition: { duration: 0.16 } },
};
