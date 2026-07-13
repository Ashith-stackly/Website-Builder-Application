"use client";

import { createElement, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { motion } from "framer-motion";
import { FaMinus, FaPen, FaPlus, FaTrash } from "react-icons/fa";
import type { BlockData } from "../buttonblock/types";
import type { DividerBlockProps } from "../dividerblock/types";
import type { IconBlockProps } from "../iconsblock/types";
import type { VideoBlockData } from "../videoblock/types";
import { applyCustomButtonStyle } from "@/lib/blockpagesButtonStyles";
import {
  collectEditableIconAnchors,
} from "@/lib/blockpagesEditTargets";
import type { BlockpagesTemplateId } from "@/lib/blockpagesTemplates";
import DividerPreview from "../dividerblock/DividerPreview";
import IconPreview from "../iconsblock/IconPreview";

type OverlayKind = "image" | "button" | "video" | "icon";

type EditOverlayTarget = {
  id: string;
  kind: OverlayKind;
  top: number;
  left: number;
  title: string;
};

type BlockpagesCanvasEnhancerProps = {
  children: ReactNode;
  isImageEditingMode?: boolean;
  customImages?: Record<string, string>;
  onEditImage?: (imageId: string) => void;
  editingImageId?: string | null;
  isButtonEditingMode?: boolean;
  customButtons?: Record<string, BlockData["props"]>;
  onEditButton?: (buttonId: string) => void;
  editingButtonId?: string | null;
  isVideoEditingMode?: boolean;
  onEditVideo?: (videoId: string) => void;
  isIconEditingMode?: boolean;
  onEditIcon?: (iconId: string) => void;
  editingIconId?: string | null;
  customIcons?: Record<string, IconBlockProps>;
  videoBlocks?: VideoBlockData[];
  template?: BlockpagesTemplateId;
  appliedDividers?: { id: string; props: DividerBlockProps; position?: { x: number; y: number }; scale?: number }[];
  onRemoveDivider?: (id: string) => void;
  onUpdateDividerPosition?: (id: string, position: { x: number; y: number }) => void;
  onUpdateDividerScale?: (id: string, scale: number) => void;
  appliedIcons?: { id: string; props: IconBlockProps; position?: { x: number; y: number }; scale?: number }[];
  onRemoveIcon?: (id: string) => void;
  onUpdateIconPosition?: (id: string, position: { x: number; y: number }) => void;
  onUpdateIconScale?: (id: string, scale: number) => void;
};

const OVERLAY_BUTTON_CLASS: Record<OverlayKind, string> = {
  image:
    "bg-white/90 text-gray-800 p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-transform border border-gray-200",
  button:
    "bg-white/90 text-gray-800 p-1.5 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-transform border border-gray-200",
  video:
    "bg-white/90 text-gray-800 p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-transform border border-gray-200",
  icon:
    "bg-white/90 text-gray-800 p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-transform border border-gray-200",
};

const OVERLAY_DIMENSION: Record<OverlayKind, { width: number; height: number }> = {
  image: { width: 36, height: 36 },
  button: { width: 28, height: 28 },
  video: { width: 36, height: 36 },
  icon: { width: 36, height: 36 },
};

const OVERLAY_EDGE_PADDING = 4;

function isInsideBuilderChrome(node: Element | null) {
  return Boolean(node?.closest("[data-builder-chrome='true']"));
}

/** Template site header / nav chrome — no image or button edit overlays here. */
function isInsideTemplateHeader(element: HTMLElement) {
  return Boolean(
    element.closest(
      [
        "header",
        ".buyscreen-header",
        ".buyscreen-categories",
        ".portfolio-shell > .sticky",
        ".portfolio-mobile-menu",
        ".restaurant-shell > header",
        ".construction-shell header",
        ".blog-page header",
        ".dm-shell > .sticky",
        "[data-template-header='true']",
      ].join(", ")
    )
  );
}

function getElementClassName(element: HTMLElement) {
  if (typeof element.className === "string") return element.className;
  return "";
}

const TEMPLATE_CHROME_CONTROL_LABELS = [
  "preview",
  "desktop view",
  "tablet view",
  "mobile view",
  "back to landing",
  "scroll preview to top",
  "previous testimonial",
  "next testimonial",
];

function getControlLabel(element: HTMLElement) {
  const srOnly = element.querySelector(".sr-only");
  const srText = srOnly?.textContent?.trim().toLowerCase() ?? "";
  return (
    srText ||
    (element.getAttribute("title") ?? "").toLowerCase() ||
    (element.getAttribute("aria-label") ?? "").toLowerCase()
  );
}

function matchesChromeControlLabel(label: string) {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return false;
  return TEMPLATE_CHROME_CONTROL_LABELS.some(
    (chromeLabel) => normalized === chromeLabel || normalized.includes(chromeLabel)
  );
}

/** Icon-only circular controls in floating device/preview pill toolbars. */
function isInDevicePreviewPillToolbar(element: HTMLElement) {
  if (element.closest("[data-template-chrome='true'], .blog-device-toolbar-inner, [data-device-preview-toolbar='true']")) {
    return true;
  }

  const toolbarRoot = element.closest(".fixed");
  if (!toolbarRoot) return false;

  const pill = toolbarRoot.querySelector(
    ".rounded-full, [data-device-preview-toolbar='true'], .blog-device-toolbar-inner"
  );
  if (!pill) return false;

  const controls = pill.querySelectorAll("button, a");
  if (controls.length < 3) return false;

  let iconOnlyControls = 0;
  let chromeLabeledControls = 0;

  controls.forEach((control) => {
    const htmlControl = control as HTMLElement;
    const label = getControlLabel(htmlControl);
    if (matchesChromeControlLabel(label)) {
      chromeLabeledControls += 1;
    }

    const text = (htmlControl.textContent ?? "").replace(/\s+/g, "");
    const hasIcon = Boolean(htmlControl.querySelector("svg, img"));
    const className = getElementClassName(htmlControl).toLowerCase();
    const rect = htmlControl.getBoundingClientRect();

    if (
      hasIcon &&
      text.length <= 24 &&
      className.includes("rounded-full") &&
      rect.width >= 28 &&
      rect.width <= 56 &&
      rect.height >= 28 &&
      rect.height <= 56
    ) {
      iconOnlyControls += 1;
    }
  });

  return chromeLabeledControls >= 2 || iconOnlyControls >= 3;
}

/** Device preview / builder toolbars — not editable content buttons. */
function isTemplateChromeButton(element: HTMLElement) {
  if (isInDevicePreviewPillToolbar(element)) {
    return true;
  }

  const controlLabel = getControlLabel(element);
  if (matchesChromeControlLabel(controlLabel)) {
    return true;
  }

  return false;
}

function isEditableButton(element: HTMLElement) {
  if (isInsideBuilderChrome(element)) return false;
  if (isInsideTemplateHeader(element)) return false;
  if (isTemplateChromeButton(element)) return false;
  if (element.getAttribute("data-blockpages-edit-overlay") === "true") return false;

  const rect = element.getBoundingClientRect();
  if (rect.width < 28 || rect.height < 22) return false;

  const className = getElementClassName(element).toLowerCase();
  const tag = element.tagName.toLowerCase();

  if (tag === "button") {
    const label = getControlLabel(element);
    if (matchesChromeControlLabel(label)) {
      return false;
    }
    if (
      label.includes("menu") ||
      label.includes("close") ||
      label.includes("cart") ||
      label.includes("wishlist") ||
      label.includes("search") ||
      label.includes("profile")
    ) {
      return false;
    }

    if (element.hasAttribute("aria-expanded")) {
      const inFaq = element.closest("section[id*='faq' i], [id*='faq' i]");
      if (inFaq) return false;
    }

    if (element.closest("footer") && !className.includes("bg-") && !className.includes("rounded-full")) {
      return false;
    }

    return (
      className.includes("bg-") ||
      className.includes("rounded-full") ||
      className.includes("rounded-xl") ||
      className.includes("rounded-lg") ||
      className.includes("rounded-md") ||
      className.includes("inline-flex") ||
      className.includes("shadow") ||
      (element as HTMLButtonElement).type === "submit"
    );
  }

  if (tag === "a") {
    if (element.closest("footer a") && !className.includes("bg-") && !className.includes("rounded-full")) {
      return false;
    }

    return (
      className.includes("rounded-full") ||
      className.includes("rounded-lg") ||
      className.includes("rounded-xl") ||
      className.includes("inline-flex") ||
      className.includes("btn") ||
      className.includes("button") ||
      className.includes("bg-")
    );
  }

  return false;
}

function getOverlayPosition(
  container: HTMLElement,
  element: HTMLElement,
  kind: OverlayKind
): { top: number; left: number } | null {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  if (elementRect.width < 1 || elementRect.height < 1) return null;

  const { width: overlayWidth, height: overlayHeight } = OVERLAY_DIMENSION[kind];
  const pad = OVERLAY_EDGE_PADDING;

  let top =
    kind === "video"
      ? elementRect.top - containerRect.top + 16
      : elementRect.top - containerRect.top + pad;

  // Place inside the top-right corner so overflow-x-hidden on the canvas does not clip the icon.
  let left = elementRect.right - containerRect.left - overlayWidth - pad;

  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;

  left = Math.min(left, containerWidth - overlayWidth - pad);
  left = Math.max(pad, left);
  top = Math.min(top, containerHeight - overlayHeight - pad);
  top = Math.max(pad, top);

  return { top, left };
}

export default function BlockpagesCanvasEnhancer({
  children,
  isImageEditingMode = false,
  customImages = {},
  onEditImage,
  editingImageId,
  isButtonEditingMode = false,
  customButtons = {},
  onEditButton,
  editingButtonId,
  isVideoEditingMode = false,
  onEditVideo,
  isIconEditingMode = false,
  onEditIcon,
  editingIconId,
  customIcons = {},
  videoBlocks = [],
  template,
  appliedDividers = [],
  onRemoveDivider,
  onUpdateDividerPosition,
  onUpdateDividerScale,
  appliedIcons = [],
  onRemoveIcon,
  onUpdateIconPosition,
  onUpdateIconScale,
}: BlockpagesCanvasEnhancerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRootsRef = useRef<Map<string, Root>>(new Map());
  const [overlayTargets, setOverlayTargets] = useState<EditOverlayTarget[]>([]);

  const syncOverlayTargets = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      setOverlayTargets([]);
      return;
    }

    const targets: EditOverlayTarget[] = [];

    const images = Array.from(container.querySelectorAll("img")).filter((img) => !isInsideBuilderChrome(img));
    images.forEach((img, index) => {
      const htmlImg = img as HTMLImageElement;
      if (isInsideTemplateHeader(htmlImg)) return;

      const rect = htmlImg.getBoundingClientRect();
      if (rect.width > 0 && rect.width < 36 && rect.height < 36) return;

      const imageId =
        htmlImg.getAttribute("data-image-id") ||
        htmlImg.getAttribute("data-blockpages-image-id") ||
        `img_${index}`;
      htmlImg.setAttribute("data-blockpages-image-id", imageId);

      if (isImageEditingMode && onEditImage) {
        const position = getOverlayPosition(container, htmlImg, "image");
        if (position) {
          targets.push({
            id: imageId,
            kind: "image",
            top: position.top,
            left: position.left,
            title: "Edit Image",
          });
        }
      }
    });

    const buttonElements = Array.from(container.querySelectorAll("button, a")).filter((el): el is HTMLElement =>
      isEditableButton(el as HTMLElement)
    );

    buttonElements.forEach((element, index) => {
      const buttonId =
        element.getAttribute("data-button-id") ||
        element.getAttribute("data-blockpages-button-id") ||
        `btn_${index}`;
      element.setAttribute("data-blockpages-button-id", buttonId);

      if (isButtonEditingMode && onEditButton) {
        const position = getOverlayPosition(container, element, "button");
        if (position) {
          targets.push({
            id: buttonId,
            kind: "button",
            top: position.top,
            left: position.left,
            title: "Edit Button",
          });
        }
      }
    });

    const iconAnchors = collectEditableIconAnchors(container);
    iconAnchors.forEach((anchor, index) => {
      const iconId = anchor.getAttribute("data-blockpages-icon-id") || `icon_${index}`;
      anchor.setAttribute("data-blockpages-icon-id", iconId);

      if (isIconEditingMode && onEditIcon) {
        const position = getOverlayPosition(container, anchor, "icon");
        if (position) {
          targets.push({
            id: iconId,
            kind: "icon",
            top: position.top,
            left: position.left,
            title: "Edit Icon",
          });
        }
      }
    });

    setOverlayTargets(targets);
  }, [
    isImageEditingMode,
    isButtonEditingMode,
    isVideoEditingMode,
    isIconEditingMode,
    onEditImage,
    onEditButton,
    onEditVideo,
    onEditIcon,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const images = Array.from(container.querySelectorAll("img")).filter((img) => !isInsideBuilderChrome(img));
    images.forEach((img, index) => {
      const htmlImg = img as HTMLImageElement;
      const imageId =
        htmlImg.getAttribute("data-image-id") ||
        htmlImg.getAttribute("data-blockpages-image-id") ||
        `img_${index}`;

      const customSrc = customImages[imageId];
      if (customSrc && htmlImg.src !== customSrc) {
        htmlImg.src = customSrc;
      }

      if (editingImageId === imageId) {
        htmlImg.style.outline = "2px dashed #63e5ff";
        htmlImg.style.outlineOffset = "4px";
      } else {
        htmlImg.style.outline = "";
        htmlImg.style.outlineOffset = "";
      }
    });

    const buttonElements = Array.from(container.querySelectorAll("button, a")).filter((el): el is HTMLElement =>
      isEditableButton(el as HTMLElement)
    );

    buttonElements.forEach((element, index) => {
      const buttonId =
        element.getAttribute("data-button-id") ||
        element.getAttribute("data-blockpages-button-id") ||
        `btn_${index}`;

      applyCustomButtonStyle(element, buttonId, customButtons);

      if (editingButtonId === buttonId) {
        element.style.outline = "2px dashed #63e5ff";
        element.style.outlineOffset = "4px";
      } else if (!isButtonEditingMode) {
        element.style.outline = "";
        element.style.outlineOffset = "";
      }
    });

    const iconAnchors = collectEditableIconAnchors(container);
    iconAnchors.forEach((anchor, index) => {
      const iconId = anchor.getAttribute("data-blockpages-icon-id") || `icon_${index}`;
      anchor.setAttribute("data-blockpages-icon-id", iconId);

      if (editingIconId === iconId) {
        anchor.style.outline = "2px dashed #63e5ff";
        anchor.style.outlineOffset = "4px";
      } else if (isIconEditingMode) {
        anchor.style.outline = "2px dashed #60a5fa";
        anchor.style.outlineOffset = "4px";
        anchor.style.cursor = "pointer";
      } else {
        anchor.style.outline = "";
        anchor.style.outlineOffset = "";
        anchor.style.cursor = "";
      }
    });
  }, [customImages, customButtons, editingImageId, editingButtonId, editingIconId, isButtonEditingMode, isIconEditingMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isIconEditingMode || !onEditIcon) return;

    const handleClick = (event: MouseEvent) => {
      const slot = (event.target as Element | null)?.closest('[data-blockpages-icon-slot="true"]');
      if (!slot || !container.contains(slot)) return;

      const iconId = slot.getAttribute("data-blockpages-icon-id");
      if (!iconId) return;

      event.preventDefault();
      event.stopPropagation();
      onEditIcon(iconId);
    };

    container.addEventListener("click", handleClick, true);
    return () => container.removeEventListener("click", handleClick, true);
  }, [isIconEditingMode, onEditIcon]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const roots = iconRootsRef.current;
    const activeIconIds = new Set(Object.keys(customIcons));

    Object.entries(customIcons).forEach(([iconId, props]) => {
      const anchor = container.querySelector(`[data-blockpages-icon-id="${iconId}"]`) as HTMLElement | null;
      if (!anchor) return;

      anchor.querySelectorAll("svg, img").forEach((element) => {
        (element as HTMLElement).style.display = "none";
      });

      let mountPoint = anchor.querySelector("[data-blockpages-custom-icon-mount]") as HTMLElement | null;
      if (!mountPoint) {
        mountPoint = document.createElement("span");
        mountPoint.setAttribute("data-blockpages-custom-icon-mount", "true");
        mountPoint.className = "inline-flex items-center justify-center";
        anchor.appendChild(mountPoint);
      }

      let root = roots.get(iconId);
      if (!root) {
        root = createRoot(mountPoint);
        roots.set(iconId, root);
      }
      root.render(createElement(IconPreview, { props }));
    });

    container.querySelectorAll("[data-blockpages-icon-id]").forEach((node) => {
      const anchor = node as HTMLElement;
      const iconId = anchor.getAttribute("data-blockpages-icon-id");
      if (!iconId || activeIconIds.has(iconId)) return;

      anchor.querySelectorAll("[data-blockpages-custom-icon-mount]").forEach((mount) => mount.remove());
      anchor.querySelectorAll("svg, img").forEach((element) => {
        (element as HTMLElement).style.display = "";
      });

      const root = roots.get(iconId);
      if (root) {
        root.unmount();
        roots.delete(iconId);
      }
    });
  }, [customIcons]);

  useLayoutEffect(() => {
    syncOverlayTargets();

    const container = containerRef.current;
    if (!container) return;

    const handleReposition = () => {
      window.requestAnimationFrame(syncOverlayTargets);
    };

    const handleScrollToSection = (event: Event) => {
      const sectionId = (event as CustomEvent<string>).detail;
      if (!sectionId) return;

      const escapeSectionId =
        typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(sectionId) : sectionId;

      const scrollRoot =
        container.closest("[data-textblock-canvas]") ??
        container.closest("[data-blockpages-scroll-root]") ??
        container;

      const target =
        scrollRoot.querySelector(`#${escapeSectionId}`) ??
        container.querySelector(`#${escapeSectionId}`) ??
        document.getElementById(sectionId);

      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("scrollToSectionEvent", handleScrollToSection as EventListener);

    const observer = new MutationObserver(handleReposition);
    observer.observe(container, { childList: true, subtree: true, attributes: true });

    const delayed = window.setTimeout(handleReposition, 400);
    const delayed2 = window.setTimeout(handleReposition, 1200);

    return () => {
      window.clearTimeout(delayed);
      window.clearTimeout(delayed2);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("scrollToSectionEvent", handleScrollToSection as EventListener);
      observer.disconnect();
    };
  }, [syncOverlayTargets]);

  const handleOverlayClick = (target: EditOverlayTarget) => {
    if (target.kind === "image") onEditImage?.(target.id);
    if (target.kind === "button") onEditButton?.(target.id);
    if (target.kind === "video") onEditVideo?.(target.id);
    if (target.kind === "icon") onEditIcon?.(target.id);
  };

  return (
    <div ref={containerRef} className="relative w-full min-w-0 max-w-full">
      {children}

      {overlayTargets.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-[120] overflow-visible" aria-hidden={false}>
          {overlayTargets.map((target) => (
            <button
              key={`${target.kind}-${target.id}`}
              type="button"
              data-blockpages-edit-overlay="true"
              title={target.title}
              className={`pointer-events-auto absolute z-[121] flex cursor-pointer items-center justify-center ${OVERLAY_BUTTON_CLASS[target.kind]}`}
              style={{ top: target.top, left: target.left }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleOverlayClick(target);
              }}
            >
              <FaPen size={target.kind === "button" ? 12 : 14} />
            </button>
          ))}
        </div>
      )}

      {appliedIcons.map((icon, index) => (
        <motion.div
          key={icon.id}
          drag
          dragMomentum={false}
          initial={{ x: icon.position?.x ?? 0, y: icon.position?.y ?? 0 }}
          onDragEnd={(_event, info) => {
            onUpdateIconPosition?.(icon.id, {
              x: (icon.position?.x ?? 0) + info.offset.x,
              y: (icon.position?.y ?? 0) + info.offset.y,
            });
          }}
          data-draggable-chrome="true"
          className="absolute left-0 z-[100] flex w-full max-w-full flex-col items-center bg-transparent cursor-move active:cursor-grabbing px-4 py-2 sm:px-6 md:px-12 lg:px-20"
          style={{ top: `${200 + index * 50}px` }}
          title="Drag to move the icon"
        >
          <div className="relative flex flex-col items-center justify-center group/inner outline-none" tabIndex={0}>
            <div
              className="relative z-10 rounded-md p-2 transition-transform group-hover/inner:outline group-hover/inner:outline-2 group-hover/inner:outline-dashed group-hover/inner:outline-blue-400 group-focus-within/inner:outline group-focus-within/inner:outline-2 group-focus-within/inner:outline-blue-400"
              style={{ transform: `scale(${icon.scale ?? 1})`, transformOrigin: "center" }}
            >
              <IconPreview props={icon.props} />
            </div>
            <div
              data-builder-chrome="true"
              className="absolute -top-10 left-1/2 z-[110] hidden -translate-x-1/2 items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5 shadow-xl group-hover/inner:flex group-focus-within/inner:flex"
            >
              <button
                type="button"
                onClick={() => onUpdateIconScale?.(icon.id, Math.max(0.2, (icon.scale ?? 1) - 0.1))}
                className="flex cursor-pointer items-center justify-center rounded-md bg-gray-100 p-1.5 text-gray-700 shadow-sm transition-transform hover:scale-105 hover:bg-gray-200"
                title="Decrease Size"
              >
                <FaMinus size={12} />
              </button>
              <button
                type="button"
                onClick={() => onUpdateIconScale?.(icon.id, (icon.scale ?? 1) + 0.1)}
                className="flex cursor-pointer items-center justify-center rounded-md bg-gray-100 p-1.5 text-gray-700 shadow-sm transition-transform hover:scale-105 hover:bg-gray-200"
                title="Increase Size"
              >
                <FaPlus size={12} />
              </button>
              <button
                type="button"
                onClick={() => onRemoveIcon?.(icon.id)}
                className="flex cursor-pointer items-center justify-center rounded-md bg-red-50 p-1.5 text-red-500 shadow-sm transition-transform hover:scale-105 hover:bg-red-100"
                title="Remove Icon"
              >
                <FaTrash size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}

      {appliedDividers.map((divider, index) => (
        <motion.div
          key={divider.id}
          drag
          dragMomentum={false}
          initial={{ x: divider.position?.x ?? 0, y: divider.position?.y ?? 0 }}
          onDragEnd={(_event, info) => {
            onUpdateDividerPosition?.(divider.id, {
              x: (divider.position?.x ?? 0) + info.offset.x,
              y: (divider.position?.y ?? 0) + info.offset.y,
            });
          }}
          data-draggable-chrome="true"
          className="absolute left-0 z-[100] flex w-full max-w-full flex-col items-center bg-transparent cursor-move active:cursor-grabbing px-4 py-2 sm:px-6 md:px-12 lg:px-20"
          style={{ top: `${400 + index * 60}px` }}
          title="Drag to move the divider"
        >
          <div className="group/inner relative flex w-full flex-col items-center outline-none" tabIndex={0}>
            <div
              className="relative z-10 rounded-md p-2 transition-transform group-hover/inner:outline group-hover/inner:outline-2 group-hover/inner:outline-dashed group-hover/inner:outline-blue-400 group-focus-within/inner:outline group-focus-within/inner:outline-2 group-focus-within/inner:outline-blue-400"
              style={{ transform: `scale(${divider.scale ?? 1})`, transformOrigin: "center", width: divider.props.width || "100%" }}
            >
              <DividerPreview props={divider.props} />
            </div>
            <div
              data-builder-chrome="true"
              className="absolute -top-10 left-1/2 z-[110] hidden -translate-x-1/2 items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5 shadow-xl group-hover/inner:flex group-focus-within/inner:flex"
            >
              <button
                type="button"
                onClick={() => onUpdateDividerScale?.(divider.id, Math.max(0.2, (divider.scale ?? 1) - 0.1))}
                className="flex cursor-pointer items-center justify-center rounded-md bg-gray-100 p-1.5 text-gray-700 shadow-sm transition-transform hover:scale-105 hover:bg-gray-200"
                title="Decrease Size"
              >
                <FaMinus size={12} />
              </button>
              <button
                type="button"
                onClick={() => onUpdateDividerScale?.(divider.id, (divider.scale ?? 1) + 0.1)}
                className="flex cursor-pointer items-center justify-center rounded-md bg-gray-100 p-1.5 text-gray-700 shadow-sm transition-transform hover:scale-105 hover:bg-gray-200"
                title="Increase Size"
              >
                <FaPlus size={12} />
              </button>
              <button
                type="button"
                onClick={() => onRemoveDivider?.(divider.id)}
                className="flex cursor-pointer items-center justify-center rounded-md bg-red-50 p-1.5 text-red-500 shadow-sm transition-transform hover:scale-105 hover:bg-red-100"
                title="Remove Divider"
              >
                <FaTrash size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
