import type { BlockpagesTemplateId } from "./blockpagesTemplates";

const TEMPLATE_HEADER_SELECTORS = [
  "header",
  "[data-blockpages-template-header='true']",
  "[data-template-header='true']",
  ".buyscreen-header",
  ".buyscreen-top-header",
  ".buyscreen-categories",
  ".portfolio-shell > .sticky",
  ".portfolio-shell .sticky",
  ".portfolio-mobile-menu",
  ".restaurant-shell > header",
  ".restaurant-shell header",
  ".construction-shell header",
  ".blog-page header",
  ".blog-blockpages-root header",
  ".dm-shell .sticky",
  ".dm-shell [data-blockpages-template-header='true']",
  ".dm-shell header",
  "#dm-mobile-nav",
  "#restaurant-mobile-nav",
  "#construction-mobile-nav",
  "#blog-mobile-nav",
].join(", ");

function isInsideBuilderChrome(node: Element | null) {
  return Boolean(node?.closest("[data-builder-chrome='true'], [data-blockpages-edit-overlay='true']"));
}

export function isInsideTemplateHeader(element: Element | null) {
  if (!element) return false;
  return Boolean(element.closest(TEMPLATE_HEADER_SELECTORS));
}

function getElementClassName(element: Element): string {
  if (typeof element.className === "string") return element.className;
  if (element.className && typeof (element.className as any).baseVal === "string") {
    return (element.className as any).baseVal;
  }
  return element.getAttribute("class") || "";
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
  const existingAnchor = svg.closest("[data-blockpages-icon-id]") as HTMLElement | null;
  if (existingAnchor) return existingAnchor;

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

  // Never treat a mounted custom icon as an editable template icon
  if (svg.closest("[data-blockpages-custom-icon-mount]")) return false;

  const interactiveParent = svg.closest("button, a");
  if (interactiveParent && isTemplateChromeButton(interactiveParent as HTMLElement)) {
    return false;
  }

  // If this SVG was previously marked as an original icon or is inside an anchored slot, it's editable
  if (svg.hasAttribute("data-blockpages-original-icon") || svg.closest("[data-blockpages-icon-id]")) {
    return true;
  }

  const rect = svg.getBoundingClientRect();
  // If element is measured, allow all standard icon sizes (10px to 140px)
  if (rect.width > 0 && rect.height > 0) {
    if (rect.width < 10 || rect.height < 10) return false;
    if (rect.width > 140 || rect.height > 140) return false;
  } else {
    // If not yet measured in layout, check explicit width/height attributes if any
    const widthAttr = parseFloat(svg.getAttribute("width") || "0");
    const heightAttr = parseFloat(svg.getAttribute("height") || "0");
    if (widthAttr > 0 && widthAttr < 10) return false;
    if (heightAttr > 0 && heightAttr < 10) return false;
  }

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

export function resolveStableIconId(
  element: HTMLElement | SVGElement,
  templateName = "tpl",
  seenCounts?: Map<string, number>
): string {
  const explicit =
    element.getAttribute("data-blockpages-icon-id") ||
    element.getAttribute("data-icon-id");
  if (explicit) return explicit;

  // 1. Derive section
  const section = element.closest(
    "section[id], [data-blockpages-section-id], header, footer, [id*='section' i], [id*='hero' i], [id*='about' i], [id*='product' i], [id*='service' i], [id*='blog' i], [id*='contact' i], [id*='faq' i], [id*='team' i], [id*='pricing' i], [id*='testimonial' i]"
  ) || element.closest("section, article, footer, header, main, div[id]");

  let sectionId =
    section?.getAttribute("data-blockpages-section-id") ||
    section?.id;

  if (!sectionId && section) {
    const tag = section.tagName.toLowerCase();
    const container = section.closest("[data-blockpages-template-root]") || section.ownerDocument.body;
    const siblings = Array.from(container.querySelectorAll(tag));
    const sIdx = siblings.indexOf(section);
    sectionId = sIdx >= 0 ? `${tag}-${sIdx + 1}` : tag;
  }
  if (!sectionId) sectionId = "sec";
  sectionId = sectionId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);

  // 2. Derive card/product/item context
  const card = element.closest(
    ".buyscreen-product-card, article, [data-product-id], .card, [class*='product-card'], [class*='blog-card'], [class*='item-card'], [class*='menu-item'], [class*='feature-card'], [class*='feature']"
  );
  let cardId = "";
  if (card && card !== section) {
    const explicitCardId = card.getAttribute("data-product-id") || card.getAttribute("id");
    if (explicitCardId) {
      cardId = explicitCardId.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    } else {
      const cardTitle = card.querySelector(
        "h1, h2, h3, h4, h5, .buyscreen-product-meta p, p.uppercase, p.font-bold, p.font-semibold"
      )?.textContent?.trim();
      if (cardTitle) {
        cardId = cardTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
      } else {
        const cardSiblings = Array.from(card.parentElement?.children || []).filter(c => c.tagName === card.tagName);
        const cIdx = cardSiblings.indexOf(card);
        cardId = cIdx >= 0 ? `item-${cIdx + 1}` : "";
      }
    }
  }
  if (cardId) {
    cardId = cardId.replace(/^-+|-+$/g, "");
  }

  // 3. Derive role or class
  const aria = element.getAttribute("aria-label") || element.getAttribute("title");
  let role = (aria || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  if (!role) {
    const className = getElementClassName(element).toLowerCase();
    if (className.includes("phone")) role = "phone";
    else if (className.includes("mail") || className.includes("envelope")) role = "email";
    else if (className.includes("location") || className.includes("map") || className.includes("pin")) role = "location";
    else if (className.includes("star")) role = "star";
    else if (className.includes("check")) role = "check";
    else if (className.includes("cart")) role = "cart";
    else if (className.includes("heart") || className.includes("wishlist")) role = "wishlist";
    else if (className.includes("share")) role = "share";
    else if (className.includes("arrow")) role = "arrow";
    else if (className.includes("search")) role = "search";
    else if (className.includes("user")) role = "user";
    else role = "ico";
  }

  let baseId = `icon-${templateName}-${sectionId}`;
  if (cardId) baseId += `-${cardId}`;
  baseId += `-${role}`;

  if (seenCounts) {
    const count = seenCounts.get(baseId) ?? 0;
    seenCounts.set(baseId, count + 1);
    if (count > 0) {
      baseId += `-${count + 1}`;
    }
  }

  element.setAttribute("data-blockpages-icon-id", baseId);
  return baseId;
}

export function collectEditableIconAnchors(container: Element): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const anchors: HTMLElement[] = [];

  const addAnchor = (el: HTMLElement | null) => {
    if (!el || seen.has(el)) return;
    if (isInsideBuilderChrome(el) || isInsideTemplateHeader(el)) return;
    seen.add(el);
    anchors.push(el);
  };

  // 1. Marked icon slots
  const marked = collectMarkedIconSlots(container);
  marked.forEach(addAnchor);

  // 2. Elements with explicit icon id
  container.querySelectorAll<HTMLElement>("[data-blockpages-icon-id]").forEach(addAnchor);

  // 3. Any SVGs in the template that haven't been anchored yet
  container.querySelectorAll("svg").forEach((node) => {
    const svg = node as SVGElement;
    if (svg.closest("[data-blockpages-custom-icon-mount]")) return;
    if (!isEditableTemplateIcon(svg)) return;

    const anchor = getIconAnchorElement(svg);
    addAnchor(anchor);
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
