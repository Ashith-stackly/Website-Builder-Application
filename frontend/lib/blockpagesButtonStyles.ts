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
  const bg = (props.backgroundColor as string) || (props.bg as string) || (props.background as string) || "";
  const op = typeof props.opacity === "number" ? props.opacity : 100;
  const variant = props.buttonVariant as string;
  const br = (props.borderRadius as string) || "6px";
  const parsedBr = br !== "" && !isNaN(Number(br)) ? `${br}px` : br;
  const effect = props.effect as string;

  const textColor = (props.color as string) || (props.textColor as string);
  const fontSize = props.fontSize;
  const fontFamily = props.fontFamily as string;
  const fontWeight = props.fontWeight as string;
  const cornerRadiusValues = props.cornerRadiusValues as { tl?: number; tr?: number; br?: number; bl?: number } | undefined;

  let calculatedRadius = variant === "pill" ? "9999px" : parsedBr;
  if (cornerRadiusValues && typeof cornerRadiusValues === "object") {
    const { tl = 0, tr = 0, br = 0, bl = 0 } = cornerRadiusValues;
    if (tl || tr || br || bl) {
      calculatedRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
    }
  }

  const isActionBtn = defaultClassName.includes("buyscreen-action-btn");

  const style: CSSProperties = {
    borderRadius: calculatedRadius,
    opacity: op / 100,
    backdropFilter: effect === "blur" ? "blur(8px)" : undefined,
    boxShadow: props.dropShadow
      ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      : undefined,
    transform: `rotate(${props.rotation || 0}deg) scaleX(${props.flipH ? -1 : 1}) scaleY(${props.flipV ? -1 : 1})`,
  };

  if (parsedW && parsedW !== "auto" && !isActionBtn) style.width = parsedW;
  if (parsedH && parsedH !== "auto" && !isActionBtn) style.height = parsedH;
  if (bg) style.background = bg;
  if (textColor) style.color = textColor;
  if (fontSize && !isActionBtn) style.fontSize = typeof fontSize === "number" ? `${fontSize}px` : (fontSize as string);
  if (fontFamily) style.fontFamily = fontFamily;
  if (fontWeight) style.fontWeight = fontWeight;
  if (props.padding !== undefined && !isActionBtn) style.padding = `${props.padding}px`;

  const borderThickness = typeof props.borderThickness === "number" ? props.borderThickness : undefined;
  const borderColor = props.borderColor as string;
  if (borderThickness !== undefined) {
    style.borderWidth = `${borderThickness}px`;
    style.borderStyle = borderThickness > 0 ? "solid" : undefined;
  }
  if (borderColor) style.borderColor = borderColor;

  let className = defaultClassName;
  if (bg) {
    className = className.replace(/bg-gradient-to-r\s+from-\[[^\]]+\]\s+to-\[[^\]]+\]/g, "");
    className = className.replace(/bg-\[[^\]]+\]/g, "");
    className = className.replace(/\bbg-\S+/g, "");
  }
  if (textColor) {
    className = className.replace(/\btext-\[[^\]]+\]/g, "");
  }
  if (borderColor) {
    className = className.replace(/\bborder-\[[^\]]+\]/g, "");
  }

  return { className: className.trim(), style };
}

export function applyCustomButtonStyle(element: HTMLElement, buttonId: string, customButtons: Record<string, ButtonProps>) {
  const props = customButtons?.[buttonId];
  if (!props) {
    if (element.getAttribute("data-blockpages-customized-button") === "true") {
      const defaultStyle = element.getAttribute("data-blockpages-default-style");
      if (defaultStyle !== null && defaultStyle !== "") {
        element.setAttribute("style", defaultStyle);
      } else {
        element.removeAttribute("style");
      }
      const defaultClass = element.getAttribute("data-blockpages-default-class");
      if (defaultClass !== null) {
        element.className = defaultClass;
      }
      const defaultLabel = element.getAttribute("data-blockpages-default-label");
      if (defaultLabel !== null) {
        const textSpan = element.querySelector("span, p");
        if (textSpan) {
          if (textSpan.textContent !== defaultLabel) {
            textSpan.textContent = defaultLabel;
          }
        } else {
          const textChild = Array.from(element.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
          if (textChild) {
            if (textChild.textContent !== defaultLabel) {
              textChild.textContent = defaultLabel;
            }
          } else if (!element.querySelector("svg")) {
            element.textContent = defaultLabel;
          }
        }
        element.removeAttribute("title");
        element.removeAttribute("aria-label");
      }
      const defaultHref = element.getAttribute("data-blockpages-default-href");
      if (defaultHref !== null && element instanceof HTMLAnchorElement) {
        element.setAttribute("href", defaultHref);
      }
      const svg = element.querySelector("svg");
      if (svg) {
        svg.style.color = "";
        svg.style.stroke = "";
        svg.style.fill = "";
        const childElements = svg.querySelectorAll("path, rect, circle, line, polygon");
        childElements.forEach((el) => {
          const p = el as SVGElement;
          p.style.stroke = "";
          p.style.fill = "";
        });
      }
      element.removeAttribute("contenteditable");
      element.removeAttribute("data-blockpages-text-id");
      element.removeAttribute("data-blockpages-default-text");
      const textDescendants = element.querySelectorAll("[data-blockpages-text-id], [contenteditable], [data-blockpages-default-text]");
      textDescendants.forEach((child) => {
        child.removeAttribute("contenteditable");
        child.removeAttribute("data-blockpages-text-id");
        child.removeAttribute("data-blockpages-default-text");
      });
      element.removeAttribute("data-blockpages-customized-button");
    }
    return;
  }

  // Save defaults before applying first customization
  if (!element.hasAttribute("data-blockpages-default-style")) {
    element.setAttribute("data-blockpages-default-style", element.getAttribute("style") || "");
  }
  if (!element.hasAttribute("data-blockpages-default-class")) {
    element.setAttribute("data-blockpages-default-class", element.className);
  }
  if (!element.hasAttribute("data-blockpages-default-label")) {
    const textSpan = element.querySelector("span, p");
    if (textSpan) {
      element.setAttribute("data-blockpages-default-label", (textSpan.textContent || "").trim());
    } else {
      const textChild = Array.from(element.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
      element.setAttribute("data-blockpages-default-label", (textChild?.textContent || "").trim());
    }
  }
  if (element instanceof HTMLAnchorElement && !element.hasAttribute("data-blockpages-default-href")) {
    element.setAttribute("data-blockpages-default-href", element.getAttribute("href") || "");
  }
  element.removeAttribute("contenteditable");
  element.removeAttribute("data-blockpages-text-id");
  element.removeAttribute("data-blockpages-default-text");
  const textDescendants = element.querySelectorAll("[data-blockpages-text-id], [contenteditable], [data-blockpages-default-text]");
  textDescendants.forEach((child) => {
    child.removeAttribute("contenteditable");
    child.removeAttribute("data-blockpages-text-id");
    child.removeAttribute("data-blockpages-default-text");
  });
  element.setAttribute("data-blockpages-customized-button", "true");

  const baseClass = element.getAttribute("data-blockpages-default-class") || element.className;
  const { style, className } = getCustomButtonStyle(buttonId, customButtons, baseClass);
  element.className = className;
  Object.assign(element.style, style);

  // If the button has an SVG and is an icon-style button (like buyscreen-action-btn),
  // update SVG stroke or fill if text color or background is customized.
  const svg = element.querySelector("svg");
  const iconColor = (props.color as string) || (props.textColor as string);
  if (svg && iconColor) {
    svg.style.color = iconColor;
    if (svg.getAttribute("stroke") && svg.getAttribute("stroke") !== "none") {
      svg.style.stroke = iconColor;
    }
    if (svg.getAttribute("fill") && svg.getAttribute("fill") !== "none") {
      svg.style.fill = iconColor;
    }
    const childElements = svg.querySelectorAll("path, rect, circle, line, polygon");
    childElements.forEach((el) => {
      const p = el as SVGElement;
      const strokeAttr = p.getAttribute("stroke");
      if (strokeAttr && strokeAttr !== "none") {
        p.style.stroke = iconColor;
      }
      const fillAttr = p.getAttribute("fill");
      if (fillAttr && fillAttr !== "none") {
        p.style.fill = iconColor;
      }
    });
  }

  // Apply custom label/text ONLY without deleting existing child elements (e.g. SVG)
  const customLabel = (props.label as string) || (props.text as string) || (props.content as string);
  if (customLabel) {
    const textSpan = element.querySelector("span, p");
    if (textSpan) {
      if (textSpan.textContent !== customLabel) {
        textSpan.textContent = customLabel;
      }
    } else {
      const textChild = Array.from(element.childNodes).find(
        (n) => n.nodeType === Node.TEXT_NODE && Boolean(n.textContent?.trim())
      );
      if (textChild) {
        if (textChild.textContent !== customLabel) {
          textChild.textContent = customLabel;
        }
      } else if (!element.querySelector("svg")) {
        element.textContent = customLabel;
      } else {
        element.setAttribute("title", customLabel);
        element.setAttribute("aria-label", customLabel);
      }
    }
  }

  // Apply custom link URL if anchor
  const customUrl = (props.url as string) || (props.link as string) || (props.href as string);
  if (customUrl && element instanceof HTMLAnchorElement && element.getAttribute("href") !== customUrl) {
    element.setAttribute("href", customUrl);
  }
}
