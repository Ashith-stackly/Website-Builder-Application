import { injectPortfolioProjectsSliderNavAttributes } from "@/lib/portfolioProjectsSlider";
import { finalizeStatCounterElement } from "@/lib/blockpagesStatCounter";
import {
  prepareBlockpagesPreviewMenus,
  prepareBlockpagesPreviewNavigation,
} from "@/lib/blockpagesPreviewInteractions";
import {
  buildBlockpagesPreviewOverlayStyles,
  buildBlockpagesPreviewViewportStyles,
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
import { scrubOrphanDividerDomFromLiveCanvas } from "@/lib/blockpagesOverlayLayers";
import { applyBlogThemeCustomProperties } from "@/lib/blogPreviewTheme";
import {
  DEFAULT_PORTFOLIO_VIDEO_SRC,
  resolveVideoMediaUrl,
} from "@/lib/blockpagesVideoStorage";

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
  const captureDevice = root.getAttribute("data-blockpages-capture-device");
  if (captureDevice === "desktop" || captureDevice === "tablet" || captureDevice === "mobile") {
    root.setAttribute("data-blockpages-preview-device", captureDevice);
  } else if (!root.getAttribute("data-blockpages-preview-device")) {
    root.setAttribute("data-blockpages-preview-device", "desktop");
  }
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
  const chunks: string[] = [];
  host?.querySelectorAll(":scope > style").forEach((style) => {
    chunks.push(style.textContent ?? "");
  });
  liveCanvas.querySelectorAll("style").forEach((style) => {
    chunks.push(style.textContent ?? "");
  });

  const raw = chunks.join("\n");
  // Use :is(...) so descendant selectors stay valid. A naive comma rewrite turns
  // `[data-textblock-canvas] header { display:none }` into
  // `[data-blockpages-preview-root], [data-textblock-canvas] header { display:none }`
  // which hides the entire preview root.
  return raw
    .replace(
      /\[data-textblock-canvas\]/g,
      ":is([data-blockpages-preview-root], [data-textblock-canvas])"
    )
    .replace(
      /:is\(\[data-blockpages-preview-root\],\s*\[data-textblock-canvas\]\)\s+header:not\(\.buyscreen-header\):not\(\.buyscreen-top-header\),\s*\n?\s*:is\(\[data-blockpages-preview-root\],\s*\[data-textblock-canvas\]\)\s+nav:not\(\.buyscreen-categories\)\s*\{[^}]*\}/g,
      ""
    )
    .replace(
      /header:not\(\.buyscreen-header\):not\(\.buyscreen-top-header\),\s*\n?\s*nav:not\(\.buyscreen-categories\)\s*\{[^}]*\}/g,
      ""
    );
}

function prepareEcommercePreviewLayout(root: HTMLElement) {
  if (!root.querySelector(".buyscreen-page")) return;

  // Global Stackly NavBar already covers this chrome — drop the duplicate template top header.
  root.querySelectorAll("header.buyscreen-top-header, .buyscreen-top-header").forEach((header) => {
    header.remove();
  });

  root.querySelectorAll(".buyscreen-categories-list").forEach((list) => {
    list.classList.remove("buyscreen-categories-list--open");
  });

  root.querySelectorAll(".buyscreen-all-categories-dropdown--open").forEach((panel) => {
    panel.classList.remove("buyscreen-all-categories-dropdown--open");
  });

  root.querySelectorAll('[aria-controls="buyscreen-category-menu"], .buyscreen-all-categories-toggle').forEach((control) => {
    control.setAttribute("aria-expanded", "false");
  });

  root.querySelectorAll("header.buyscreen-header, .buyscreen-header").forEach((header) => {
    if (!(header instanceof HTMLElement)) return;
    header.style.removeProperty("display");
    header.style.removeProperty("visibility");
    header.style.removeProperty("height");
    header.style.removeProperty("max-height");
    header.style.removeProperty("opacity");
  });

  // Prefer a desktop-friendly carousel slot count in the snapshot; device CSS/JS retunes on preview.
  root.querySelectorAll<HTMLElement>(".buyscreen-products.buyscreen-products--carousel").forEach((track) => {
    const childCount = track.children.length || 4;
    const slots = Math.max(1, Math.min(4, childCount));
    track.style.setProperty("--buyscreen-carousel-slots", String(slots));
    Array.from(track.children).forEach((child, index) => {
      if (!(child instanceof HTMLElement)) return;
      child.style.display = index < slots ? "" : "none";
      child.style.flex = `0 0 calc((100% - ${(slots - 1)} * var(--buyscreen-gap, 1.5rem)) / ${slots})`;
      child.style.minWidth = "0";
    });
  });

  root.querySelectorAll<HTMLElement>(".buyscreen-products-row > .min-w-0, .buyscreen-products-row > .flex-1").forEach((viewport) => {
    viewport.style.flex = "1 1 0%";
    viewport.style.minWidth = "0";
    viewport.style.maxWidth = "100%";
  });

  // Ensure mobile preview starts with collapsed category menu (hamburger only).
  root.querySelectorAll(".buyscreen-categories-list").forEach((list) => {
    list.classList.remove("buyscreen-categories-list--open");
  });
  root.querySelectorAll('[aria-controls="buyscreen-category-menu"]').forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
  });
}

function prepareBlogPreviewLayout(root: HTMLElement) {
  if (!root.querySelector(".blog-page, .blog-blockpages-root")) return;

  root.querySelectorAll<HTMLElement>(".blog-page, .blog-blockpages-root").forEach((page) => {
    applyBlogThemeCustomProperties(page);
    page.style.setProperty("container-type", "inline-size");
    page.style.setProperty("width", "100%");
    page.style.setProperty("max-width", "100%");
    page.style.setProperty("min-width", "0");
  });

  // Ensure nested @container wrappers also form query containers for @[760px] nav.
  root.querySelectorAll<HTMLElement>(".blog-blockpages-root, .blog-blockpages-root [class*='@container'], .blog-page").forEach((el) => {
    if (!el.style.containerType) {
      el.style.setProperty("container-type", "inline-size");
    }
  });

  root.querySelectorAll<HTMLElement>('[data-blog-explore-cta="true"]').forEach((strip) => {
    strip.style.display = "flex";
    strip.style.visibility = "visible";
    strip.style.opacity = "1";
    strip.style.background = "#0a192f";
  });
  root.querySelectorAll<HTMLElement>('[data-blog-explore-button="true"], [data-blog-explore-cta="true"] a').forEach((btn) => {
    btn.style.display = "inline-flex";
    btn.style.visibility = "visible";
    btn.style.opacity = "1";
    btn.style.color = "#ffffff";
    btn.style.borderColor = "#ffffff";
    btn.style.backgroundColor = "transparent";
  });
}

function preparePortfolioPreviewLayout(root: HTMLElement) {
  if (!root.querySelector(".portfolio-shell, #video")) return;

  const sampleSrc = resolveVideoMediaUrl(DEFAULT_PORTFOLIO_VIDEO_SRC);

  root.querySelectorAll<HTMLElement>('[data-blockpages-video-slot="true"]').forEach((slot) => {
    slot.querySelectorAll("[data-blockpages-video-placeholder]").forEach((node) => node.remove());

    const existingVideo = slot.querySelector("video");
    const existingIframe = slot.querySelector("iframe");
    if (existingIframe) return;

    if (existingVideo) {
      const src = existingVideo.getAttribute("src") || "";
      if (!src || src.startsWith("blob:")) {
        existingVideo.setAttribute("src", sampleSrc);
        existingVideo.setAttribute("controls", "true");
      } else if (src.startsWith("/") && !src.startsWith("//")) {
        existingVideo.setAttribute("src", resolveVideoMediaUrl(src));
      }
      return;
    }

    const video = document.createElement("video");
    video.setAttribute("src", sampleSrc);
    video.setAttribute("controls", "true");
    video.setAttribute("playsinline", "true");
    video.setAttribute("data-blockpages-video-id", slot.getAttribute("data-blockpages-video-id") || "video_block");
    video.className = "h-full w-full object-cover";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    slot.appendChild(video);
  });
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
  root
    .querySelectorAll('[data-blockpages-overlay-container="true"] > div.absolute.inset-0')
    .forEach((layer) => layer.remove());
  root.querySelectorAll('[data-blockpages-overlay-kind="icon"]').forEach((overlay) => overlay.remove());
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

  root.querySelectorAll<HTMLElement>(".relative.flex.min-h-0.flex-1.flex-col").forEach((wrapper) => {
    wrapper.classList.remove("flex-1", "min-h-0");
  });
  root.querySelectorAll<HTMLElement>(".mx-auto.flex-1").forEach((wrapper) => {
    wrapper.classList.remove("flex-1");
  });

  revealHiddenMotionElements(root);
  finalizeStatCounters(root);
  normalizePreviewScrollRoot(root);
  injectPortfolioProjectsSliderNavAttributes(root);
  prepareBlockpagesPreviewMenus(root);
  prepareBlockpagesPreviewNavigation(root);
  if (root instanceof HTMLElement) {
    prepareEcommercePreviewLayout(root);
    prepareBlogPreviewLayout(root);
    preparePortfolioPreviewLayout(root);
  }

  return root;
}

export function buildPreviewHtmlFromCanvas(
  liveCanvas: HTMLElement,
  options?: {
    captureDevice?: BlockpagesPreviewCaptureDevice;
    appliedDividers?: BlockpagesAppliedOverlay[];
  }
) {
  const captureDevice =
    options?.captureDevice ??
    ((liveCanvas.getAttribute("data-blockpages-device") as BlockpagesPreviewCaptureDevice | null) ?? "desktop");

  const companionStyles = collectCompanionPreviewStyles(liveCanvas);
  const overlayStyles = buildBlockpagesPreviewOverlayStyles(captureDevice);
  const viewportStyles = buildBlockpagesPreviewViewportStyles(captureDevice);
  const preparedClone = prepareBlockpagesPreviewHtml(
    liveCanvas,
    captureDevice,
    options?.appliedDividers ?? []
  ) as HTMLElement;
  applyHostPresentationToPreviewRoot(liveCanvas, preparedClone);
  finalizeBlockpagesEditorMotion(preparedClone);
  sanitizeBlockpagesPreviewClone(preparedClone);

  const parts: string[] = [];
  if (companionStyles.trim() || overlayStyles.trim() || viewportStyles.trim()) {
    parts.push(
      `<style data-blockpages-preview-styles="true">${companionStyles}\n${overlayStyles}\n${viewportStyles}</style>`
    );
  }
  parts.push(preparedClone.outerHTML);
  return parts.join("");
}

export function flushBlockpagesPreviewSnapshot(
  template: TextTemplateType,
  appliedDividers?: BlockpagesAppliedOverlay[]
) {
  if (typeof document === "undefined") return false;

  const liveCanvas = document.querySelector<HTMLElement>("[data-textblock-canvas]");
  if (!liveCanvas) return false;

  const dividers = appliedDividers ?? loadAppliedDividersForTemplate(template);
  scrubOrphanDividerDomFromLiveCanvas(
    liveCanvas,
    dividers.map((divider) => divider.id)
  );
  persistPreviewSnapshot(template, liveCanvas, dividers);
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

function repairBrokenPreviewCompanionSelectors(html: string) {
  // Fix legacy snapshots that hid the whole preview root via a broken comma rewrite.
  return html
    .replace(
      /\[data-blockpages-preview-root\],\s*\[data-textblock-canvas\]/g,
      ":is([data-blockpages-preview-root], [data-textblock-canvas])"
    )
    .replace(
      /header:not\(\.buyscreen-header\):not\(\.buyscreen-top-header\),\s*nav:not\(\.buyscreen-categories\)\s*\{[^}]*display:\s*none[^}]*\}/gi,
      ""
    );
}

export function sanitizeBlockpagesPreviewHtml(html: string) {
  if (typeof document === "undefined" || !html.trim()) return html;

  const repairedHtml = repairBrokenPreviewCompanionSelectors(html);

  // Preview HTML from buildPreviewHtmlFromCanvas is already sanitized and contains
  // document-flow dividers — still repair broken companion selectors above.
  if (repairedHtml.includes('data-blockpages-preview-divider="true"')) {
    return repairedHtml;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = repairedHtml;

  const styleTags = wrapper.querySelectorAll("style[data-blockpages-preview-styles='true']");
  const styleHtml = Array.from(styleTags)
    .map((tag) => tag.outerHTML)
    .join("");

  styleTags.forEach((tag) => tag.remove());

  const root = wrapper.firstElementChild instanceof HTMLElement ? wrapper.firstElementChild : wrapper;
  sanitizeBlockpagesPreviewClone(root);
  return styleHtml + root.outerHTML;
}
