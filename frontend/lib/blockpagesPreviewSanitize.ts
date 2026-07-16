import { injectPortfolioProjectsSliderNavAttributes } from "@/lib/portfolioProjectsSlider";
import { finalizeStatCounterElement } from "@/lib/blockpagesStatCounter";
import {
  prepareBlockpagesPreviewMenus,
  prepareBlockpagesPreviewNavigation,
} from "@/lib/blockpagesPreviewInteractions";
import {
  buildBlockpagesPreviewOverlayStyles,
  prepareBlockpagesPreviewHtml,
  shouldPreservePreviewTransform,
  type BlockpagesPreviewCaptureDevice,
} from "@/lib/blockpagesOverlayLayers";
import type { TextTemplateType } from "@/app/blockpages/textblock/types";
import type { BlockpagesAppliedOverlay } from "@/lib/blockpagesOverlayLayers";
import {
  getBlockpagesPreviewSnapshotKey,
  loadAppliedDividersForTemplate,
  writeBlockpagesStorageItem,
} from "@/lib/blockpagesEditorPersistence";

function revealHiddenMotionElements(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    if (shouldPreservePreviewTransform(element)) return;

    if (element.style.opacity === "0") {
      element.style.opacity = "1";
    }

    const transform = element.style.transform;
    if (transform && transform !== "none" && /translate|matrix|scale/.test(transform)) {
      element.style.transform = "none";
    }
  });
}

export function finalizeBlockpagesEditorMotion(root: ParentNode) {
  revealHiddenMotionElements(root);
}

function finalizeStatCounters(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".stat-animate-count").forEach(finalizeStatCounterElement);
}

function normalizePreviewScrollRoot(root: HTMLElement) {
  root.setAttribute("data-blockpages-preview-root", "true");
  root.setAttribute("data-blockpages-scroll-root", "true");
  root.classList.remove(
    "custom-scrollbar",
    "overflow-y-auto",
    "overflow-x-hidden",
    "h-[calc(100vh-220px)]",
    "min-h-[560px]"
  );
  root.style.removeProperty("height");
  root.style.removeProperty("max-height");
  root.style.removeProperty("min-height");
  root.style.overflow = "visible";
}

function collectCompanionPreviewStyles(liveCanvas: HTMLElement) {
  const host = liveCanvas.closest("[data-blockpages-canvas-host]");
  if (!host) return "";

  const chunks: string[] = [];
  host.querySelectorAll(":scope > style").forEach((style) => {
    chunks.push(style.textContent ?? "");
  });

  return chunks.join("\n");
}

function applyHostPresentationToPreviewRoot(liveCanvas: HTMLElement, clone: HTMLElement) {
  const host = liveCanvas.closest("[data-blockpages-canvas-host]") as HTMLElement | null;
  if (!host) return;

  if (host.style.backgroundColor) {
    clone.style.backgroundColor = host.style.backgroundColor;
  }

  if (host.style.textAlign) {
    clone.style.textAlign = host.style.textAlign;
  }
}

export function finalizeCanvasBeforePreview(liveCanvas: HTMLElement) {
  liveCanvas.querySelectorAll<HTMLElement>('[contenteditable="true"]').forEach((element) => {
    element.blur();
  });
  finalizeBlockpagesEditorMotion(liveCanvas);
}

export function sanitizeBlockpagesPreviewClone(root: HTMLElement) {
  root.querySelectorAll('[data-blockpages-overlay-container="true"]').forEach((element) => {
    if (element instanceof HTMLElement) {
      element.style.position = "relative";
      element.style.minHeight = element.style.minHeight || "100%";
      element.style.overflow = "visible";
    }
  });
  root.querySelectorAll(".portfolio-reveal").forEach((element) => {
    element.classList.add("is-visible");
  });
  root.classList.add("blockpages-preview-static");
  root.querySelectorAll('[data-blockpages-edit-overlay="true"]').forEach((overlay) => overlay.remove());
  root.querySelectorAll("[contenteditable]").forEach((element) => element.removeAttribute("contenteditable"));
  root.querySelectorAll(".editable-text-active").forEach((element) => element.classList.remove("editable-text-active"));
  root.querySelectorAll("[data-builder-chrome='true']").forEach((element) => element.remove());
  root.querySelectorAll("[data-draggable-chrome='true']").forEach((element) => {
    element.removeAttribute("title");
    element.classList.remove(
      "cursor-move",
      "active:cursor-grabbing",
      "hover:outline",
      "hover:outline-2",
      "hover:outline-blue-400",
      "hover:outline-dashed",
      "group"
    );
  });
  root.querySelectorAll('[data-blockpages-overlay-kind="divider"]').forEach((overlay) => overlay.remove());
  root.querySelectorAll('[data-blockpages-overlay-toolbar="true"]').forEach((element) => element.remove());

  revealHiddenMotionElements(root);
  finalizeStatCounters(root);
  normalizePreviewScrollRoot(root);
  injectPortfolioProjectsSliderNavAttributes(root);
  prepareBlockpagesPreviewMenus(root);
  prepareBlockpagesPreviewNavigation(root);

  return root;
}

export function buildPreviewHtmlFromCanvas(
  liveCanvas: HTMLElement,
  options?: {
    captureDevice?: BlockpagesPreviewCaptureDevice;
    appliedDividers?: BlockpagesAppliedOverlay[];
  }
) {
  liveCanvas.querySelectorAll<HTMLElement>('[contenteditable="true"]').forEach((element) => {
    element.blur();
  });

  const captureDevice =
    options?.captureDevice ??
    ((liveCanvas.getAttribute("data-blockpages-device") as BlockpagesPreviewCaptureDevice | null) ?? "desktop");

  const companionStyles = collectCompanionPreviewStyles(liveCanvas);
  const overlayStyles = buildBlockpagesPreviewOverlayStyles(captureDevice);
  const preparedClone = prepareBlockpagesPreviewHtml(
    liveCanvas,
    captureDevice,
    options?.appliedDividers ?? []
  ) as HTMLElement;
  applyHostPresentationToPreviewRoot(liveCanvas, preparedClone);
  finalizeBlockpagesEditorMotion(preparedClone);
  sanitizeBlockpagesPreviewClone(preparedClone);

  const parts: string[] = [];
  if (companionStyles.trim() || overlayStyles.trim()) {
    parts.push(
      `<style data-blockpages-preview-styles="true">${companionStyles}\n${overlayStyles}</style>`
    );
  }
  parts.push(preparedClone.outerHTML);
  return parts.join("");
}

export function flushBlockpagesPreviewSnapshot(template: TextTemplateType) {
  if (typeof document === "undefined") return false;

  const liveCanvas = document.querySelector<HTMLElement>("[data-textblock-canvas]");
  if (!liveCanvas) return false;

  const appliedDividers = loadAppliedDividersForTemplate(template);
  persistPreviewSnapshot(template, liveCanvas, appliedDividers);
  return true;
}

export function persistPreviewSnapshot(
  template: TextTemplateType,
  liveCanvas: HTMLElement,
  appliedDividers: BlockpagesAppliedOverlay[] = []
) {
  const captureDevice =
    (liveCanvas.getAttribute("data-blockpages-device") as BlockpagesPreviewCaptureDevice | null) ?? "desktop";
  const html = buildPreviewHtmlFromCanvas(liveCanvas, { captureDevice, appliedDividers });
  if (!html.trim()) return;
  writeBlockpagesStorageItem(getBlockpagesPreviewSnapshotKey(template), html);
}

export function sanitizeBlockpagesPreviewHtml(html: string) {
  if (typeof document === "undefined" || !html.trim()) return html;

  // Preview HTML from buildPreviewHtmlFromCanvas is already sanitized and contains
  // document-flow dividers — re-sanitizing can strip or reposition them.
  if (html.includes('data-blockpages-preview-divider="true"')) {
    return html;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  const styleTags = wrapper.querySelectorAll("style[data-blockpages-preview-styles='true']");
  const styleHtml = Array.from(styleTags)
    .map((tag) => tag.outerHTML)
    .join("");

  styleTags.forEach((tag) => tag.remove());

  const root = wrapper.firstElementChild instanceof HTMLElement ? wrapper.firstElementChild : wrapper;
  sanitizeBlockpagesPreviewClone(root);
  return styleHtml + root.outerHTML;
}
