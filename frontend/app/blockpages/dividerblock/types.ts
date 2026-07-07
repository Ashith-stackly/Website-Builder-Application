export type DividerVariant =
  | "solid-line"
  | "dashed-line"
  | "dotted-line"
  | "double-line"
  | "line-with-icon"
  | "line-with-text"
  | "line-with-spacing"
  | "vertical-divider";
 
export type DividerLineStyle = "solid" | "dashed" | "dotted" | "double";
export type DividerAlignment = "left" | "center" | "right";
 
export interface DividerBlockProps {
  variant: DividerVariant;
  lineStyle: DividerLineStyle;
  weight: string;
  color: string;
  width: string;
  alignment: DividerAlignment;
  spacing: string;
  margin: string;
  centerText: string;
}
 
export interface DividerBlockData {
  id: string;
  type: "divider";
  props: DividerBlockProps;
}
 
export const DIVIDER_VARIANTS: { id: DividerVariant; label: string }[] = [
  { id: "solid-line", label: "Solid Line" },
  { id: "dashed-line", label: "Dashed Line" },
  { id: "dotted-line", label: "Dotter Line" },
  { id: "double-line", label: "Double Line" },
  { id: "line-with-icon", label: "Line with Icon" },
  { id: "line-with-text", label: "Line with Text" },
  { id: "line-with-spacing", label: "Line With Spacing" },
  { id: "vertical-divider", label: "Vertical Divider" },
];
 
export const defaultDividerProps: DividerBlockProps = {
  variant: "solid-line",
  lineStyle: "solid",
  weight: "1",
  color: "#333333",
  width: "100%",
  alignment: "center",
  spacing: "20",
  margin: "20",
  centerText: "or",
};