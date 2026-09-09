import { Star } from "lucide-react";
import type { DividerBlockProps } from "./types";
 
const parsePx = (value: string, fallback: number) => {
  const parsed = parseInt(value.replace(/\D/g, ""), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};
 
const alignmentClass = (alignment: DividerBlockProps["alignment"]) => {
  if (alignment === "left") return "mr-auto ml-0";
  if (alignment === "right") return "ml-auto mr-0";
  return "mx-auto";
};
 
export default function DividerPreview({
  props,
  compact = false,
}: {
  props: DividerBlockProps;
  compact?: boolean;
}) {
  const weight = parsePx(props.weight, 1);
  const spacing = parsePx(props.spacing, 20);
  const margin = parsePx(props.margin, 20);
  const width = props.width || "100%";
  const color = props.color || "#333333";
  const lineStyle = props.lineStyle || "solid";
 
  const marginInline =
    props.alignment === "left"
      ? { marginLeft: "0px", marginRight: "auto" }
      : props.alignment === "right"
        ? { marginLeft: "auto", marginRight: "0px" }
        : { marginLeft: "auto", marginRight: "auto" };
 
  const containerStyle = {
    width,
    maxWidth: "100%",
    marginTop: `${margin}px`,
    marginBottom: `${margin}px`,
    paddingTop: props.variant === "line-with-spacing" ? `${spacing}px` : undefined,
    paddingBottom: props.variant === "line-with-spacing" ? `${spacing}px` : undefined,
    ...marginInline,
  };
 
  if (props.variant === "vertical-divider") {
    return (
      <div
        className={`flex items-stretch ${props.alignment === "left" ? "justify-start" : props.alignment === "right" ? "justify-end" : "justify-center"} ${compact ? "h-16" : "h-24"}`}
        style={{ margin: `${margin}px 0`, width: "100%" }}
      >
        <div
          className={alignmentClass(props.alignment)}
          data-blockpages-divider-line="true"
          style={{
            width: `${weight}px`,
            backgroundColor: color,
            minHeight: compact ? "3rem" : "5rem",
          }}
        />
      </div>
    );
  }
 
  if (props.variant === "double-line") {
    return (
      <div className={`w-full ${alignmentClass(props.alignment)}`} style={containerStyle}>
        <div
          data-blockpages-divider-line="true"
          style={{ width: "100%", borderTop: `${weight}px double ${color}` }}
        />
      </div>
    );
  }
 
  if (props.variant === "line-with-icon" || props.variant === "line-with-text") {
    return (
      <div
        className={`flex w-full items-center gap-3 ${alignmentClass(props.alignment)}`}
        style={containerStyle}
      >
        <div
          className="flex-1 border-0"
          data-blockpages-divider-line="true"
          style={{ borderTop: `${weight}px ${lineStyle} ${color}`, minWidth: "10px" }}
        />
        {props.variant === "line-with-icon" ? (
          <Star className="shrink-0" size={compact ? 14 : 16} fill="currentColor" style={{ color }} />
        ) : (
          <span className="shrink-0 text-sm font-medium" style={{ color }}>{props.centerText || "or"}</span>
        )}
        <div
          className="flex-1 border-0"
          data-blockpages-divider-line="true"
          style={{ borderTop: `${weight}px ${lineStyle} ${color}`, minWidth: "10px" }}
        />
      </div>
    );
  }
 
  return (
    <div className={`w-full ${alignmentClass(props.alignment)}`} style={containerStyle}>
      <div
        data-blockpages-divider-line="true"
        style={{ width: "100%", borderTop: `${weight}px ${lineStyle} ${color}` }}
      />
    </div>
  );
}