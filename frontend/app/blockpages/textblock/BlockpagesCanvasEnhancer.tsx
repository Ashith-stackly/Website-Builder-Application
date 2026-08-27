"use client";

import { createElement, memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FaPen } from "react-icons/fa";
import type { BlockData } from "../buttonblock/types";
import type { DividerBlockProps } from "../dividerblock/types";
import type { IconBlockProps } from "../iconsblock/types";
import type { VideoBlockData } from "../videoblock/types";
import { applyCustomButtonStyle } from "@/lib/blockpagesButtonStyles";
import {
  collectEditableIconAnchors,
  isInsideTemplateHeader,
} from "@/lib/blockpagesEditTargets";
import { BLOCKPAGES_CANVAS_RESTORED_EVENT } from "@/lib/blockpagesEditorPersistence";
import { useBlockpagesOverlayToolbar } from "@/lib/blockpagesOverlayToolbar";
import {
  getDividerAnchorY,
  getVisibleCanvasAnchorY,
  resolveDividerFlowAnchor,
  resolveDividerSectionIdAtY,
  resolveDividerSectionPlacementAtY,
  scrollCanvasToDividerPosition,
  scrubOrphanDividerDomFromLiveCanvas,
  type BlockpagesOverlayPosition,
} from "@/lib/blockpagesOverlayLayers";
import { scrollBlockpagesCanvasToSection, scrollCanvasToModifiedElement } from "@/lib/blockpagesTemplateSections";
import {
  isBlockpagesTextEditingActive,
  mutationsAreFromTextEditing,
} from "@/lib/blockpagesDropdownStyles";
import DividerPreview from "../dividerblock/DividerPreview";
import IconPreview from "../iconsblock/IconPreview";
import BlockpagesInlineVideo from "../videoblock/BlockpagesInlineVideo";
import BlockpagesPositionedOverlay from "./BlockpagesPositionedOverlay";
import { assetPath } from "@/lib/paths";
import { resolveVideoBlockPropsForSlot, getDefaultPortfolioVideoProps } from "@/lib/blockpagesVideoStorage";
import { playPortfolioBlockpagesVideo } from "@/lib/blockpagesPortfolioVideo";
import type { BlockpagesTemplateId } from "@/lib/blockpagesTemplates";
import { syncCanvasTexts } from "@/lib/blockpagesTextSync";

type OverlayKind = "image" | "button" | "video" | "icon";

function unmountVideoRoots(roots: Root[]) {
  roots.forEach((root) => {
    try {
      root.unmount();
    } catch {
      // Root may already be unmounted or its container detached.
    }
  });
}

/** Drop editor video mounts without unmounting during an active React render. */
function releaseVideoRoots(
  rootsRef: MutableRefObject<Map<string, Root>>,
  container: ParentNode | null | undefined
) {
  const roots = [...rootsRef.current.values()];
  rootsRef.current.clear();
  container?.querySelectorAll("[data-blockpages-custom-video-mount]").forEach((node) => node.remove());
  if (roots.length > 0) {
    queueMicrotask(() => unmountVideoRoots(roots));
  }
}

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
  editingVideoId?: string | null;
  onEditVideo?: (videoId: string) => void;
  isIconEditingMode?: boolean;
  onEditIcon?: (iconId: string) => void;
  editingIconId?: string | null;
  customIcons?: Record<string, IconBlockProps>;
  customTexts?: Record<string, string>;
  textStyles?: Record<string, any>;
  sectionStyles?: Record<string, any>;
  videoBlocks?: VideoBlockData[];
  template?: BlockpagesTemplateId;
  appliedDividers?: {
    id: string;
    props: DividerBlockProps;
    position?: BlockpagesOverlayPosition;
    scale?: number;
  }[];
  onRemoveDivider?: (id: string) => void;
  onUpdateDividerPosition?: (id: string, position: BlockpagesOverlayPosition) => void;
  onUpdateDividerScale?: (id: string, scale: number) => void;
  appliedIcons?: { id: string; props: IconBlockProps; position?: { top?: number; left?: number; x?: number; y?: number }; scale?: number }[];
  onRemoveIcon?: (id: string) => void;
  onUpdateIconPosition?: (id: string, position: BlockpagesOverlayPosition) => void;
  onUpdateIconScale?: (id: string, scale: number) => void;
  pendingDividerScrollId?: string | null;
  onPendingDividerScrollComplete?: () => void;
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



function isExplicitHeaderEditableButton(element: HTMLElement) {
  return (
    element.hasAttribute("data-blockpages-button-id") ||
    element.getAttribute("data-blockpages-header-cta") === "true"
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

  const inHeader = isInsideTemplateHeader(element);
  if (inHeader) {
    if (!isExplicitHeaderEditableButton(element)) return false;
  } else if (isTemplateChromeButton(element)) {
    return false;
  }

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

function BlockpagesCanvasEnhancer({
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
  editingVideoId = null,
  onEditVideo,
  isIconEditingMode = false,
  onEditIcon,
  editingIconId,
  customIcons = {},
  customTexts = {},
  textStyles = {},
  sectionStyles = {},
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
  pendingDividerScrollId = null,
  onPendingDividerScrollComplete,
}: BlockpagesCanvasEnhancerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRootsRef = useRef<Map<string, Root>>(new Map());
  const videoRootsRef = useRef<Map<string, Root>>(new Map());
  const [overlayTargets, setOverlayTargets] = useState<EditOverlayTarget[]>([]);

  useBlockpagesOverlayToolbar(containerRef, {
    appliedDividers,
    appliedIcons,
    onRemoveDivider,
    onRemoveIcon,
    onUpdateDividerScale,
    onUpdateIconScale,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    const liveCanvas = container?.closest<HTMLElement>("[data-textblock-canvas]");
    if (!liveCanvas) return;

    scrubOrphanDividerDomFromLiveCanvas(
      liveCanvas,
      appliedDividers.map((divider) => divider.id)
    );
  }, [appliedDividers]);

  useEffect(() => {
    const container = containerRef.current;
    const liveCanvas = container?.closest<HTMLElement>("[data-textblock-canvas]");
    if (!container || !liveCanvas) return;

    const resolveDividerSections = () => {
      appliedDividers.forEach((divider) => {
        const overlay = container.querySelector<HTMLElement>(
          `[data-blockpages-overlay-id="${divider.id}"]`
        );
        const anchorY = divider.position?.top ?? 0;
        const insertMode = divider.position?.insertMode;

        if (divider.position?.sectionId && !insertMode) {
          const placement = resolveDividerSectionPlacementAtY(liveCanvas, anchorY);
          if (placement?.sectionId) {
            if (overlay) {
              overlay.dataset.blockpagesDividerAnchorPath = JSON.stringify(placement.anchorPath);
              overlay.dataset.blockpagesDividerInsertMode = placement.insertMode ?? "after";
              overlay.dataset.blockpagesDividerSectionId = placement.sectionId;
            }
            onUpdateDividerPosition?.(divider.id, {
              top: divider.position?.top ?? placement.top ?? anchorY,
              left: divider.position?.left ?? placement.left ?? 16,
              anchorPath: placement.anchorPath,
              insertMode: placement.insertMode,
              sectionId: placement.sectionId,
            });
          }
        }

        if (!overlay) return;

        const resolved = resolveDividerFlowAnchor(liveCanvas, overlay);
        if (!resolved?.sectionId) return;

        const needsSectionUpdate =
          !divider.position?.sectionId ||
          divider.position.sectionId !== resolved.sectionId ||
          !divider.position.anchorPath?.length;

        if (!needsSectionUpdate) return;

        overlay.dataset.blockpagesDividerAnchorPath = JSON.stringify(resolved.path);
        overlay.dataset.blockpagesDividerInsertMode = resolved.mode;
        overlay.dataset.blockpagesDividerSectionId = resolved.sectionId;

        onUpdateDividerPosition?.(divider.id, {
          top: divider.position?.top ?? resolved.top ?? 0,
          left: divider.position?.left ?? resolved.left ?? 16,
          anchorPath: resolved.path,
          insertMode: resolved.mode,
          sectionId: resolved.sectionId,
        });

        if (pendingDividerScrollId === divider.id) {
          requestAnimationFrame(() => {
            scrollCanvasToDividerPosition(
              liveCanvas,
              divider.position?.top ?? resolved.top ?? 0
            );
            onPendingDividerScrollComplete?.();
          });
        }
      });
    };

    resolveDividerSections();

    const delayed = window.setTimeout(resolveDividerSections, 400);
    const delayed2 = window.setTimeout(resolveDividerSections, 1200);
    const templateRoot = container.firstElementChild as HTMLElement | null;
    const observer = templateRoot
      ? new MutationObserver((mutations) => {
          if (mutationsAreFromTextEditing(mutations)) return;
          window.requestAnimationFrame(resolveDividerSections);
        })
      : null;

    if (observer && templateRoot) {
      observer.observe(templateRoot, { childList: true, subtree: true });
    }

    return () => {
      window.clearTimeout(delayed);
      window.clearTimeout(delayed2);
      observer?.disconnect();
    };
  }, [
    appliedDividers,
    onUpdateDividerPosition,
    pendingDividerScrollId,
    onPendingDividerScrollComplete,
  ]);

  const syncOverlayTargets = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      setOverlayTargets((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    if (!isImageEditingMode && !isButtonEditingMode && !isVideoEditingMode && !isIconEditingMode) {
      setOverlayTargets((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const targets: EditOverlayTarget[] = [];

    if (isImageEditingMode && onEditImage) {
      const images = Array.from(container.querySelectorAll("img")).filter((img) => !isInsideBuilderChrome(img));
      images.forEach((img, index) => {
        const htmlImg = img as HTMLImageElement;
        const imageId =
          htmlImg.getAttribute("data-image-id") ||
          htmlImg.getAttribute("data-blockpages-image-id") ||
          `img_${index}`;
        htmlImg.setAttribute("data-blockpages-image-id", imageId);

        if (isInsideTemplateHeader(htmlImg)) return;

        const rect = htmlImg.getBoundingClientRect();
        if (rect.width > 0 && rect.width < 36 && rect.height < 36) return;

        if (editingImageId && imageId !== editingImageId) return;
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
      });
    }

    if (isButtonEditingMode && onEditButton) {
      const buttonElements = Array.from(container.querySelectorAll("button, a")).filter((el): el is HTMLElement =>
        isEditableButton(el as HTMLElement)
      );

      buttonElements.forEach((element, index) => {
        const buttonId =
          element.getAttribute("data-button-id") ||
          element.getAttribute("data-blockpages-button-id") ||
          `btn_${index}`;
        element.setAttribute("data-blockpages-button-id", buttonId);

        if (editingButtonId && buttonId !== editingButtonId) return;
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
      });
    }

    if (isIconEditingMode && onEditIcon) {
      const iconAnchors = collectEditableIconAnchors(container);
      iconAnchors.forEach((anchor, index) => {
        const iconId = anchor.getAttribute("data-blockpages-icon-id") || `icon_${index}`;
        anchor.setAttribute("data-blockpages-icon-id", iconId);

        if (editingIconId && iconId !== editingIconId) return;
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
      });
    }

    if (isVideoEditingMode && onEditVideo) {
      const videoAnchors = Array.from(
        container.querySelectorAll<HTMLElement>(
          "[data-blockpages-video-slot='true'], [data-blockpages-video-id], video"
        )
      ).filter((element) => !isInsideBuilderChrome(element));

      videoAnchors.forEach((anchor, index) => {
        const rect = anchor.getBoundingClientRect();
        if (rect.width < 48 || rect.height < 48) return;

        const videoId = anchor.getAttribute("data-blockpages-video-id") || `video_${index}`;
        anchor.setAttribute("data-blockpages-video-id", videoId);

        const position = getOverlayPosition(container, anchor, "video");
        if (position) {
          targets.push({
            id: videoId,
            kind: "video",
            top: position.top,
            left: position.left,
            title: "Edit Video",
          });
        }
      });
    }

    setOverlayTargets((prev) => {
      if (
        prev.length === targets.length &&
        prev.every(
          (t, i) =>
            t.id === targets[i].id &&
            t.kind === targets[i].kind &&
            Math.abs(t.top - targets[i].top) < 1 &&
            Math.abs(t.left - targets[i].left) < 1
        )
      ) {
        return prev;
      }
      return targets;
    });
  }, [
    isImageEditingMode,
    isButtonEditingMode,
    isVideoEditingMode,
    isIconEditingMode,
    editingImageId,
    editingButtonId,
    editingIconId,
    editingVideoId,
    onEditImage,
    onEditButton,
    onEditVideo,
    onEditIcon,
  ]);

  const handleOverlayAction = useCallback(
    (target: EditOverlayTarget, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (target.kind === "image") {
        onEditImage?.(target.id);
      } else if (target.kind === "button") {
        onEditButton?.(target.id);
      } else if (target.kind === "video") {
        onEditVideo?.(target.id);
      } else if (target.kind === "icon") {
        onEditIcon?.(target.id);
      }
    },
    [onEditImage, onEditButton, onEditVideo, onEditIcon]
  );

  const applyCanvasCustomizations = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Synchronize Images
    const images = Array.from(container.querySelectorAll("img")).filter((img) => !isInsideBuilderChrome(img));
    images.forEach((img, index) => {
      const htmlImg = img as HTMLImageElement;
      const imageId =
        htmlImg.getAttribute("data-image-id") ||
        htmlImg.getAttribute("data-blockpages-image-id") ||
        `img_${index}`;
      htmlImg.setAttribute("data-blockpages-image-id", imageId);

      const customSrc = customImages[imageId];
      if (customSrc) {
        if (htmlImg.hasAttribute("srcset")) htmlImg.removeAttribute("srcset");
        if (htmlImg.hasAttribute("srcSet")) htmlImg.removeAttribute("srcSet");
        if (htmlImg.srcset) htmlImg.srcset = "";

        if (htmlImg.src !== customSrc) {
          htmlImg.src = customSrc;
          htmlImg.setAttribute("src", customSrc);
        }
      }

      if (editingImageId === imageId) {
        htmlImg.style.outline = "2px dashed #63e5ff";
        htmlImg.style.outlineOffset = "4px";
      } else {
        htmlImg.style.outline = "";
        htmlImg.style.outlineOffset = "";
      }
    });

    // 2. Synchronize Buttons
    const buttonElements = Array.from(container.querySelectorAll("button, a")).filter((el): el is HTMLElement =>
      isEditableButton(el as HTMLElement)
    );

    buttonElements.forEach((element, index) => {
      const buttonId =
        element.getAttribute("data-button-id") ||
        element.getAttribute("data-blockpages-button-id") ||
        `btn_${index}`;
      element.setAttribute("data-blockpages-button-id", buttonId);

      applyCustomButtonStyle(element, buttonId, customButtons);

      if (editingButtonId === buttonId) {
        element.style.outline = "2px dashed #63e5ff";
        element.style.outlineOffset = "4px";
      } else if (!isButtonEditingMode) {
        element.style.outline = "";
        element.style.outlineOffset = "";
      }
    });

    // 3. Synchronize Texts
    // syncCanvasTexts internally checks and protects any actively edited element from innerHTML writes.
    syncCanvasTexts(
      container,
      template || "tpl",
      customTexts,
      (typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null)
    );

    // 4. Synchronize Icons
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

    if (customIcons && Object.keys(customIcons).length > 0) {
      const roots = iconRootsRef.current;
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
    }

    // 5. Synchronize Section Styles
    if (sectionStyles && Object.keys(sectionStyles).length > 0) {
      Object.entries(sectionStyles).forEach(([sectionId, config]) => {
        if (!config || typeof config !== "object") return;
        const sectionEl =
          container.querySelector(`#${sectionId}`) ||
          container.querySelector(`[data-section-id="${sectionId}"]`) ||
          container.querySelector(`[data-blockpages-section-id="${sectionId}"]`);
        if (sectionEl instanceof HTMLElement) {
          if (config.backgroundColor) sectionEl.style.backgroundColor = config.backgroundColor;
          if (config.textColor) sectionEl.style.color = config.textColor;
          if (config.padding) sectionEl.style.padding = `${config.padding}px`;
        }
      });
    }

    // 6. Synchronize Video Slots
    container.querySelectorAll<HTMLElement>("[data-blockpages-video-slot='true']").forEach((slot, index) => {
      const videoId = slot.getAttribute("data-blockpages-video-id") || `video_${index}`;
      slot.setAttribute("data-blockpages-video-id", videoId);

      if (editingVideoId === videoId) {
        slot.style.outline = "2px dashed #63e5ff";
        slot.style.outlineOffset = "4px";
      } else if (isVideoEditingMode) {
        slot.style.outline = "2px dashed #60a5fa";
        slot.style.outlineOffset = "4px";
        slot.style.cursor = "pointer";
      } else {
        slot.style.outline = "";
        slot.style.outlineOffset = "";
        slot.style.cursor = "";
      }
    });
  }, [
    customImages,
    customButtons,
    customIcons,
    customTexts,
    sectionStyles,
    textStyles,
    template,
    editingImageId,
    editingButtonId,
    editingIconId,
    editingVideoId,
    isButtonEditingMode,
    isIconEditingMode,
    isVideoEditingMode,
  ]);

  useEffect(() => {
    applyCanvasCustomizations();
  }, [applyCanvasCustomizations]);

  useEffect(() => {
    const activeId = editingImageId || editingButtonId || editingIconId;
    if (activeId) {
      window.requestAnimationFrame(() => {
        scrollCanvasToModifiedElement(activeId);
      });
    }
  }, [editingImageId, editingButtonId, editingIconId]);

  useEffect(() => {
    const handleRestore = () => {
      applyCanvasCustomizations();
      syncOverlayTargets();
    };

    window.addEventListener(BLOCKPAGES_CANVAS_RESTORED_EVENT, handleRestore);
    return () => window.removeEventListener(BLOCKPAGES_CANVAS_RESTORED_EVENT, handleRestore);
  }, [applyCanvasCustomizations, syncOverlayTargets]);

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
    if (!container || !isVideoEditingMode || !onEditVideo) return;

    const handleClick = (event: MouseEvent) => {
      const slot = (event.target as Element | null)?.closest('[data-blockpages-video-slot="true"]');
      if (!slot || !container.contains(slot)) return;

      const videoId = slot.getAttribute("data-blockpages-video-id");
      if (!videoId) return;

      event.preventDefault();
      event.stopPropagation();
      onEditVideo(videoId);
    };

    container.addEventListener("click", handleClick, true);
    return () => container.removeEventListener("click", handleClick, true);
  }, [isVideoEditingMode, onEditVideo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWatchVideoClick = (event: MouseEvent) => {
      const trigger = (event.target as Element | null)?.closest("[data-blockpages-watch-video]");
      if (!trigger || !container.contains(trigger)) return;

      event.preventDefault();
      event.stopPropagation();

      const videoId = trigger.getAttribute("data-blockpages-watch-video") || "video_block";
      const templateRoot = container.querySelector<HTMLElement>("[data-blockpages-template-root]") ?? container;
      playPortfolioBlockpagesVideo(templateRoot, videoId);
    };

    container.addEventListener("click", handleWatchVideoClick, true);
    return () => container.removeEventListener("click", handleWatchVideoClick, true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || template !== "portfolio") return;

    const roots = videoRootsRef.current;

    container.querySelectorAll<HTMLElement>('[data-blockpages-video-slot="true"]').forEach((slot) => {
      const slotId = slot.getAttribute("data-blockpages-video-id") || "video_block";
      const blockProps =
        resolveVideoBlockPropsForSlot(slotId, videoBlocks) ?? getDefaultPortfolioVideoProps();

      slot.querySelectorAll("[data-blockpages-video-placeholder]").forEach((node) => node.remove());

      let mountPoint = slot.querySelector("[data-blockpages-custom-video-mount]") as HTMLElement | null;
      let root = roots.get(slotId);

      if (!root || !mountPoint?.isConnected) {
        if (root) {
          roots.delete(slotId);
        }
        mountPoint?.remove();
        mountPoint = document.createElement("div");
        mountPoint.setAttribute("data-blockpages-custom-video-mount", "true");
        mountPoint.className = "absolute inset-0 z-[1]";
        slot.appendChild(mountPoint);
        root = createRoot(mountPoint);
        roots.set(slotId, root);
      }

      const posterFallback =
        customImages["video_block_bg"] || assetPath("/video_block_bg.png");
      root.render(createElement(BlockpagesInlineVideo, { blockProps, posterFallback }));
    });
  }, [template, videoBlocks, customImages]);

  useEffect(() => {
    if (template === "portfolio") return;
    releaseVideoRoots(videoRootsRef, containerRef.current);
  }, [template]);

  useEffect(() => {
    return () => {
      releaseVideoRoots(videoRootsRef, containerRef.current);
    };
  }, []);

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
    applyCanvasCustomizations();
    syncOverlayTargets();

    const container = containerRef.current;
    if (!container) return;

    const handleReposition = () => {
      if (isBlockpagesTextEditingActive()) return;
      window.requestAnimationFrame(() => {
        applyCanvasCustomizations();
        syncOverlayTargets();
      });
    };

    const handleScrollToSection = (event: Event) => {
      const sectionId = (event as CustomEvent<string>).detail;
      if (!sectionId) return;
      scrollBlockpagesCanvasToSection(sectionId);
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("scrollToSectionEvent", handleScrollToSection as EventListener);

    const observer = new MutationObserver((mutations) => {
      if (mutationsAreFromTextEditing(mutations)) return;
      const isSelfOverlayMutation = mutations.every((m) => {
        const target = m.target as HTMLElement | null;
        return target?.closest?.("[data-blockpages-edit-overlay='true'], [data-blockpages-overlay='true']");
      });
      if (isSelfOverlayMutation) return;
      handleReposition();
    });
    observer.observe(container, { childList: true, subtree: true });

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
  }, [applyCanvasCustomizations, syncOverlayTargets]);

  const handleDividerPositionChange = useCallback(
    (overlayId: string, nextPosition: BlockpagesOverlayPosition) => {
      const container = containerRef.current;
      const liveCanvas = container?.closest<HTMLElement>("[data-textblock-canvas]");
      const overlay = container?.querySelector<HTMLElement>(`[data-blockpages-overlay-id="${overlayId}"]`);

      if (liveCanvas && overlay) {
        const resolved = resolveDividerFlowAnchor(liveCanvas, overlay);
        if (resolved?.sectionId) {
          overlay.dataset.blockpagesDividerAnchorPath = JSON.stringify(resolved.path);
          overlay.dataset.blockpagesDividerInsertMode = resolved.mode;
          overlay.dataset.blockpagesDividerSectionId = resolved.sectionId;
          onUpdateDividerPosition?.(overlayId, {
            top: nextPosition.top ?? resolved.top ?? 0,
            left: nextPosition.left ?? resolved.left ?? 16,
            anchorPath: resolved.path,
            insertMode: resolved.mode,
            sectionId: resolved.sectionId,
          });
          return;
        }

        const anchorY =
          typeof nextPosition.top === "number"
            ? nextPosition.top + 6
            : container
              ? getDividerAnchorY(overlay, container)
              : 0;
        const fallbackSectionId = resolveDividerSectionIdAtY(liveCanvas, anchorY);
        if (fallbackSectionId) {
          overlay.dataset.blockpagesDividerSectionId = fallbackSectionId;
          overlay.dataset.blockpagesDividerInsertMode = "after";
          onUpdateDividerPosition?.(overlayId, {
            top: nextPosition.top ?? 0,
            left: nextPosition.left ?? 16,
            insertMode: "after",
            sectionId: fallbackSectionId,
          });
          return;
        }
      }

      onUpdateDividerPosition?.(overlayId, {
        top: nextPosition.top ?? 0,
        left: nextPosition.left ?? 0,
      });
    },
    [onUpdateDividerPosition]
  );

  const handleOverlayClick = (target: EditOverlayTarget) => {
    if (target.kind === "image") onEditImage?.(target.id);
    if (target.kind === "button") onEditButton?.(target.id);
    if (target.kind === "video") onEditVideo?.(target.id);
    if (target.kind === "icon") onEditIcon?.(target.id);
  };

  return (
    <div ref={containerRef} data-blockpages-overlay-container="true" className="relative w-full min-w-0 max-w-full overflow-visible">
      <div data-blockpages-template-root="true" className="relative w-full min-w-0 max-w-full">
        {children}
      </div>

      {overlayTargets.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-120 overflow-visible" aria-hidden={false}>
          {overlayTargets.map((target) => (
            <button
              key={`${target.kind}-${target.id}`}
              type="button"
              data-blockpages-edit-overlay="true"
              title={target.title}
              className={`pointer-events-auto absolute z-121 flex cursor-pointer items-center justify-center ${OVERLAY_BUTTON_CLASS[target.kind]}`}
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
        <BlockpagesPositionedOverlay
          key={icon.id}
          id={icon.id}
          index={index}
          kind="icon"
          position={icon.position}
          scale={icon.scale ?? 1}
          onPositionChange={(overlayId, nextPosition) =>
            onUpdateIconPosition?.(overlayId, {
              top: nextPosition.top ?? 0,
              left: nextPosition.left ?? 0,
            })
          }
          onScaleChange={(overlayId, nextScale) => onUpdateIconScale?.(overlayId, nextScale)}
          onRemove={(overlayId) => onRemoveIcon?.(overlayId)}
        >
          <IconPreview props={icon.props} />
        </BlockpagesPositionedOverlay>
      ))}

      {appliedDividers.map((divider, index) => (
        <BlockpagesPositionedOverlay
          key={divider.id}
          id={divider.id}
          index={index}
          kind="divider"
          position={divider.position}
          scale={divider.scale ?? 1}
          onPositionChange={handleDividerPositionChange}
          onScaleChange={(overlayId, nextScale) => onUpdateDividerScale?.(overlayId, nextScale)}
          onRemove={(overlayId) => onRemoveDivider?.(overlayId)}
          contentStyle={{ width: divider.props.width || "100%" }}
        >
          <DividerPreview props={divider.props} />
        </BlockpagesPositionedOverlay>
      ))}
    </div>
  );
}

export default memo(BlockpagesCanvasEnhancer);
