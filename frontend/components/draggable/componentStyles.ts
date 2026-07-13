import type { CSSProperties } from "react";
import type { BuilderComponent, ComponentStyles } from "@/types/builder";

/**
 * Convert the builder's `ComponentStyles` to a React `CSSProperties` object.
 * All keys are mapped 1:1 except for non-CSS helper fields like `layoutCols`.
 */
export const toReactStyle = (styles: ComponentStyles): CSSProperties => ({
  color: styles.color,
  backgroundColor: styles.backgroundColor,
  padding: styles.padding,
  margin: styles.margin,
  borderRadius: styles.borderRadius,
  fontSize: styles.fontSize,
  fontFamily: styles.fontFamily,
  fontWeight: styles.fontWeight as CSSProperties["fontWeight"],
  width: styles.width,
  height: styles.height,
  textAlign: styles.textAlign,
  /* Effects */
  opacity: styles.opacity ? parseFloat(styles.opacity) : undefined,
  boxShadow: styles.boxShadow || undefined,
  border: styles.border || undefined,
  overflow: styles.overflow as CSSProperties["overflow"],
  cursor: styles.cursor as CSSProperties["cursor"],
  transform: styles.transform || undefined,
  transition: styles.transition || undefined,
  /* Freeform positioning */
  position: styles.position as CSSProperties["position"],
  left: styles.left || undefined,
  top: styles.top || undefined,
  zIndex: styles.zIndex ? parseInt(styles.zIndex, 10) : undefined,
  minWidth: styles.minWidth || undefined,
  minHeight: styles.minHeight || undefined,
});

/** Convenience wrapper: accept a full BuilderComponent and return CSSProperties. */
export const getBaseStyles = (component: BuilderComponent): CSSProperties =>
  toReactStyle(component.styles);

export const getTextStyles = (styles: ComponentStyles): CSSProperties => ({
  color: styles.color,
  fontSize: styles.fontSize,
  fontFamily: styles.fontFamily,
  fontWeight: styles.fontWeight as CSSProperties["fontWeight"],
  textAlign: styles.textAlign,
});

export const getTargetTextStyles = (
  component: BuilderComponent,
  key: string,
  fallback?: CSSProperties,
): CSSProperties => {
  const override = component.textStyles?.[key];

  return {
    ...(fallback ?? getTextStyles(component.styles)),
    ...(override ? toReactStyle(override as ComponentStyles) : {}),
  };
};

