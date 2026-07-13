import type { BlockpagesTemplateId } from "./blockpagesTemplates";

const TEMPLATE_HEADER_SELECTORS = [
  "header",
  "[data-blockpages-template-header='true']",
  ".buyscreen-header",
  ".buyscreen-categories",
  ".portfolio-shell > .sticky",
  ".portfolio-mobile-menu",
  ".restaurant-shell > header",
  ".restaurant-shell header",
  ".construction-shell header",
  ".blog-page header",
  ".blog-blockpages-root header",
  ".dm-shell .sticky",
  ".dm-shell [data-blockpages-template-header='true']",
  "[data-template-header='true']",
].join(", ");

function isInsideBuilderChrome(node: Element | null) {
  return Boolean(node?.closest("[data-builder-chrome='true'], [data-blockpages-edit-overlay='true']"));
}

function isInsideTemplateHeader(element: Element) {
  return Boolean(element.closest(TEMPLATE_HEADER_SELECTORS));
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

export function templateHasBuiltInVideoSlots(template: BlockpagesTemplateId): boolean {
  return template === "portfolio";
}

export function templateHasBuiltInIconSlots(template: BlockpagesTemplateId): boolean {
  return template === "portfolio";
}

export function getBlockpagesCanvasElement(): Element | null {
  if (typeof document === "undefined") return null;
  return document.querySelector("[data-textblock-canvas]");
}

export function getIconAnchorElement(svg: SVGElement): HTMLElement {
  const parent = svg.parentElement;
  if (!parent) return svg as unknown as HTMLElement;

  const parentClass = getElementClassName(parent).toLowerCase();
  const svgCount = parent.querySelectorAll("svg").length;
  const isIconWrapper =
    svgCount === 1 &&
    (parentClass.includes("flex") ||
      parentClass.includes("grid") ||
      parentClass.includes("items-center") ||
      parentClass.includes("justify-center") ||
      parentClass.includes("rounded-full") ||
      parentClass.includes("rounded-2xl"));

  if (isIconWrapper) {
    return parent;
  }

  return svg as unknown as HTMLElement;
}

export function isEditableTemplateIcon(svg: SVGElement): boolean {
  if (isInsideBuilderChrome(svg)) return false;
  if (isInsideTemplateHeader(svg)) return false;

  const interactiveParent = svg.closest("button, a");
  if (interactiveParent && isTemplateChromeButton(interactiveParent as HTMLElement)) {
    return false;
  }

  const rect = svg.getBoundingClientRect();
  if (rect.width < 18 || rect.height < 18) return false;
  if (rect.width > 96 || rect.height > 96) return false;

  const label = getControlLabel(svg.closest("button, a") as HTMLElement | null ?? (svg as unknown as HTMLElement));
  if (matchesChromeControlLabel(label)) return false;

  return true;
}

export function collectMarkedIconSlots(container: Element): HTMLElement[] {
  return Array.from(container.querySelectorAll('[data-blockpages-icon-slot="true"]')).filter((node) => {
    const element = node as HTMLElement;
    if (isInsideBuilderChrome(element)) return false;
    if (isInsideTemplateHeader(element)) return false;
    return true;
  }) as HTMLElement[];
}

export function collectEditableIconAnchors(container: Element): HTMLElement[] {
  const marked = collectMarkedIconSlots(container);
  if (marked.length > 0) {
    return marked;
  }

  const seen = new Set<HTMLElement>();
  const anchors: HTMLElement[] = [];

  container.querySelectorAll("svg").forEach((node) => {
    const svg = node as SVGElement;
    if (!isEditableTemplateIcon(svg)) return;

    const anchor = getIconAnchorElement(svg);
    if (seen.has(anchor)) return;

    seen.add(anchor);
    anchors.push(anchor);
  });

  return anchors;
}

export function scanCanvasForVideoTargets(container: Element): boolean {
  const videos = Array.from(container.querySelectorAll("video")).filter((video) => !isInsideBuilderChrome(video));
  if (videos.length > 0) return true;

  return Array.from(container.querySelectorAll("iframe")).some((frame) => {
    const src = frame.getAttribute("src") ?? "";
    return src.includes("youtube") || src.includes("vimeo") || src.includes("player.");
  });
}

export function scanCanvasForIconTargets(container: Element): number {
  return collectEditableIconAnchors(container).length;
}

export function scrollToFirstIconTarget(container?: Element | null): boolean {
  const canvas = container ?? getBlockpagesCanvasElement();
  if (!canvas) return false;

  const first = collectEditableIconAnchors(canvas)[0];
  if (!first) return false;

  first.scrollIntoView({ behavior: "smooth", block: "center" });
  return true;
}

export function findCanvasVideoSlot(container: Element): HTMLElement | null {
  const existingVideo = container.querySelector("[data-blockpages-video-id]") as HTMLElement | null;
  if (existingVideo) {
    return (existingVideo.closest("[data-blockpages-video-slot='true']") as HTMLElement | null) ?? existingVideo;
  }

  const markedSlot = container.querySelector("[data-blockpages-video-slot='true']") as HTMLElement | null;
  if (markedSlot) return markedSlot;

  const images = Array.from(container.querySelectorAll("img")).filter((img) => !isInsideBuilderChrome(img));
  const heroImage = images.find((img) => {
    if (isInsideTemplateHeader(img)) return false;
    const rect = img.getBoundingClientRect();
    return rect.width >= 200;
  }) as HTMLImageElement | undefined;

  if (!heroImage) return null;

  const wrapper =
    (heroImage.closest(".relative, .aspect-video, [class*='rounded']") as HTMLElement | null) ??
    heroImage.parentElement;

  return wrapper ?? heroImage;
}
