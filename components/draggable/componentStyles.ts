import type { CSSProperties } from "react";
import type { ComponentStyles } from "@/types/builder";

export const toReactStyle = (styles: ComponentStyles): CSSProperties => ({
  color: styles.color,
  backgroundColor: styles.backgroundColor,
  padding: styles.padding,
  margin: styles.margin,
  borderRadius: styles.borderRadius,
  fontSize: styles.fontSize,
  width: styles.width,
  height: styles.height,
  textAlign: styles.textAlign,
});
