import type { CSSProperties } from "react";
import type { BlockData } from "@/app/blockpages/buttonblock/types";

type ButtonProps = BlockData["props"];

export function getCustomButtonStyle(buttonId: string, customButtons: Record<string, ButtonProps>, defaultClassName = "") {
  const props = customButtons?.[buttonId];
  if (!props) return { className: defaultClassName, style: {} as CSSProperties };

  const w = (props.width as string) || "";
  const parsedW = w !== "" && !isNaN(Number(w)) ? `${w}px` : w;
  const h = (props.height as string) || "";
  const parsedH = h !== "" && !isNaN(Number(h)) ? `${h}px` : h;
  const bg = (props.backgroundColor as string) || "";
  const op = typeof props.opacity === "number" ? props.opacity : 100;
  const variant = props.buttonVariant as string;
  const br = (props.borderRadius as string) || "6px";
  const parsedBr = br !== "" && !isNaN(Number(br)) ? `${br}px` : br;
  const effect = props.effect as string;

  const style: CSSProperties = {
    borderRadius: variant === "pill" ? "9999px" : parsedBr,
    opacity: op / 100,
    backdropFilter: effect === "blur" ? "blur(8px)" : undefined,
    boxShadow: props.dropShadow
      ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      : undefined,
    transform: `rotate(${props.rotation || 0}deg) scaleX(${props.flipH ? -1 : 1}) scaleY(${props.flipV ? -1 : 1})`,
  };

  if (parsedW && parsedW !== "auto") style.width = parsedW;
  if (parsedH && parsedH !== "auto") style.height = parsedH;
  if (bg) style.background = bg;
  if (props.padding !== undefined) style.padding = `${props.padding}px`;

  const borderThickness = typeof props.borderThickness === "number" ? props.borderThickness : undefined;
  const borderColor = props.borderColor as string;
  if (borderThickness !== undefined) {
    style.borderWidth = `${borderThickness}px`;
    style.borderStyle = borderThickness > 0 ? "solid" : undefined;
  }
  if (borderColor) style.borderColor = borderColor;

  let className = defaultClassName;
  if (bg) {
    className = className.replace(/bg-gradient-to-r\s+from-\[[^\]]+\]\s+to-\[[^\]]+\]/, "");
    className = className.replace(/bg-\[[^\]]+\]/, "");
  }

  return { className: className.trim(), style };
}

export function applyCustomButtonStyle(element: HTMLElement, buttonId: string, customButtons: Record<string, ButtonProps>) {
  const { style } = getCustomButtonStyle(buttonId, customButtons, element.className);
  Object.assign(element.style, style);
}
