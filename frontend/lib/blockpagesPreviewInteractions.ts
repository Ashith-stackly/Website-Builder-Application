import {
  BLOCKPAGES_TEMPLATE_SECTIONS,
  type BlockpagesTemplateSection,
} from "@/lib/blockpagesTemplateSections";
import type { BlockpagesTemplateId } from "@/lib/blockpagesTemplates";

const OPEN_MAX_HEIGHT = ["max-h-[800px]", "max-h-96", "max-h-48", "max-h-40", "max-h-[75vh]"];
const CLOSED_MAX_HEIGHT = ["max-h-0"];

const PREVIEW_TEMPLATE_MARKERS: Array<{ template: BlockpagesTemplateId; selector: string }> = [
  { template: "portfolio", selector: ".portfolio-shell" },
  { template: "ecommerce", selector: ".buyscreen-page" },
  { template: "blog", selector: ".blog-blockpages-root, .blog-page" },
  { template: "construction", selector: ".construction-shell" },
  { template: "restaurant", selector: ".restaurant-shell" },
  { template: "digital-marketing", selector: ".dm-shell" },
  { template: "business", selector: ".dm-shell" },
];

const PREVIEW_CTA_SCROLL: Partial<Record<BlockpagesTemplateId, Record<string, string>>> = {
  restaurant: {
    "explore food": "restaurant-menu",
    "book a table": "restaurant-contact",
  },
  construction: {
    "get started": "const-contact",
    "view projects": "const-projects",
  },
  "digital-marketing": {
    "get started": "contact",
    "learn more": "about",
  },
  business: {
    "get started": "contact",
    "learn more": "about",
  },
  ecommerce: {
    "shop now": "buyscreen-products",
    "buy now": "buyscreen-products",
  },
};

function normalizePreviewLabel(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function detectPreviewTemplate(root: ParentNode): BlockpagesTemplateId | null {
  for (const entry of PREVIEW_TEMPLATE_MARKERS) {
    if (root.querySelector(entry.selector)) {
      return entry.template;
    }
  }
  return null;
}

function resolveSectionIdForLabel(
  sections: BlockpagesTemplateSection[],
  label: string,
  template: BlockpagesTemplateId
) {
  const normalized = normalizePreviewLabel(label);
  if (!normalized) return null;

  const ctaMatch = PREVIEW_CTA_SCROLL[template]?.[normalized];
  if (ctaMatch) return ctaMatch;

  const exact = sections.find((section) => normalizePreviewLabel(section.label) === normalized);
  if (exact) return exact.id;

  const partial = sections.find((section) => {
    const sectionLabel = normalizePreviewLabel(section.label);
    return normalized.includes(sectionLabel) || sectionLabel.includes(normalized);
  });
  return partial?.id ?? null;
}

export function prepareBlockpagesPreviewNavigation(root: ParentNode) {
  const template = detectPreviewTemplate(root);
  if (!template) return;

  const sections = BLOCKPAGES_TEMPLATE_SECTIONS[template] ?? [];

  root.querySelectorAll<HTMLElement>("a[href^='#']").forEach((link) => {
    const hash = link.getAttribute("href")?.slice(1).trim();
    if (!hash) return;
    link.setAttribute("data-blockpages-preview-scroll", hash);
  });

  root.querySelectorAll<HTMLElement>(
    "header button, header nav button, nav.buyscreen-categories button, .buyscreen-top-header-nav-item, .buyscreen-category-item, main button, section button"
  ).forEach((button) => {
    if (button.closest("[data-builder-chrome='true'], [data-blockpages-overlay-toolbar='true']")) return;

    const label = button.textContent ?? "";
    const sectionId = resolveSectionIdForLabel(sections, label, template);
    if (!sectionId) return;

    button.setAttribute("data-blockpages-preview-scroll", sectionId);
  });
}

function scrollBlockpagesPreviewToSection(sectionId: string, doc: Document = document) {
  const escaped =
    typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(sectionId) : sectionId.replace(/"/g, '\\"');

  const scrollRoot = doc.querySelector<HTMLElement>(
    "[data-blockpages-preview-root], [data-blockpages-scroll-root], [data-textblock-canvas]"
  );
  const target =
    scrollRoot?.querySelector<HTMLElement>(`#${escaped}`) ?? doc.getElementById(sectionId);

  if (!target) return;

  if (scrollRoot && scrollRoot !== doc.documentElement && scrollRoot !== doc.body) {
    const rootRect = scrollRoot.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = scrollRoot.scrollTop + (targetRect.top - rootRect.top) - 8;
    scrollRoot.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function isMaxHeightMenuOpen(panel: HTMLElement) {
  return OPEN_MAX_HEIGHT.some((className) => panel.classList.contains(className));
}

function setMaxHeightMenuOpen(panel: HTMLElement, open: boolean) {
  panel.classList.remove(...OPEN_MAX_HEIGHT, ...CLOSED_MAX_HEIGHT, "opacity-0", "opacity-100");

  if (open) {
    if (panel.classList.contains("portfolio-mobile-menu")) {
      panel.classList.add("max-h-40", "opacity-100");
      return;
    }
    if (panel.querySelector("#dm-mobile-nav")) {
      panel.classList.add("max-h-48", "opacity-100");
      return;
    }
    panel.classList.add("max-h-[800px]", "opacity-100");
    return;
  }

  panel.classList.add("max-h-0", "opacity-0");
}

function resolveMenuPanel(doc: Document, button: Element): HTMLElement | null {
  const controlsId = button.getAttribute("aria-controls");
  if (controlsId) {
    const controlled = doc.getElementById(controlsId);
    if (controlled) {
      if (controlled.classList.contains("buyscreen-categories-list")) {
        return controlled;
      }
      const collapsibleParent = controlled.closest<HTMLElement>(
        ".overflow-hidden, .portfolio-mobile-menu, [data-blockpages-preview-menu-panel='true']"
      );
      return collapsibleParent ?? controlled;
    }
  }

  if (button.classList.contains("portfolio-mobile-menu-btn")) {
    return doc.querySelector<HTMLElement>(".portfolio-mobile-menu");
  }

  const header = button.closest("[data-blockpages-template-header='true'], header");
  if (!header) return null;

  return (
    header.querySelector<HTMLElement>("[data-blockpages-preview-menu-panel='true']") ??
    header.querySelector<HTMLElement>(".portfolio-mobile-menu") ??
    header.querySelector<HTMLElement>("#construction-mobile-nav") ??
    header.querySelector<HTMLElement>("#restaurant-mobile-nav") ??
    header.parentElement?.querySelector<HTMLElement>("#dm-mobile-nav")?.parentElement ??
    null
  );
}

function isMenuOpen(_doc: Document, button: Element, panel: HTMLElement) {
  if (panel.classList.contains("buyscreen-categories-list")) {
    return panel.classList.contains("buyscreen-categories-list--open");
  }

  if (panel.classList.contains("hidden")) {
    return false;
  }

  if (panel.classList.contains("portfolio-mobile-menu") || panel.classList.contains("overflow-hidden")) {
    return isMaxHeightMenuOpen(panel);
  }

  const expanded = button.getAttribute("aria-expanded");
  if (expanded === "true" || expanded === "false") {
    return expanded === "true";
  }

  return panel.getAttribute("aria-hidden") !== "true";
}

function setMenuOpen(button: Element, panel: HTMLElement, open: boolean) {
  if (panel.classList.contains("buyscreen-categories-list")) {
    panel.classList.toggle("buyscreen-categories-list--open", open);
  } else if (panel.classList.contains("portfolio-mobile-menu") || panel.classList.contains("overflow-hidden")) {
    setMaxHeightMenuOpen(panel, open);
  } else {
    panel.classList.toggle("hidden", !open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
  }

  button.setAttribute("aria-expanded", open ? "true" : "false");
}

function isPreviewMenuToggle(button: Element) {
  if (!(button instanceof HTMLElement) || button.tagName !== "BUTTON") return false;
  if (button.classList.contains("portfolio-mobile-menu-btn")) return true;
  if (button.hasAttribute("data-blockpages-preview-menu-toggle")) return true;
  if (button.hasAttribute("data-blockpages-interactive") && button.hasAttribute("aria-controls")) return true;

  const label = (button.getAttribute("aria-label") ?? "").toLowerCase();
  if (label.includes("menu") && button.hasAttribute("aria-expanded")) return true;

  return false;
}

function closePreviewMenus(doc: Document) {
  doc
    .querySelectorAll<HTMLElement>(
      "[data-blockpages-preview-menu-panel='true'], .portfolio-mobile-menu, #construction-mobile-nav, #restaurant-mobile-nav, #blog-mobile-nav, .buyscreen-categories-list"
    )
    .forEach((panel) => {
      const toggle =
        doc.querySelector<HTMLElement>(`[aria-controls="${panel.id}"]`) ??
        doc.querySelector<HTMLElement>(".portfolio-mobile-menu-btn");
      if (toggle) {
        setMenuOpen(toggle, panel, false);
      }
    });
}

function handlePreviewMenuClick(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest("button");
  if (!button || !isPreviewMenuToggle(button)) return;

  const doc = button.ownerDocument;
  const panel = resolveMenuPanel(doc, button);
  if (!panel) return;

  event.preventDefault();
  event.stopPropagation();

  const nextOpen = !isMenuOpen(doc, button, panel);
  setMenuOpen(button, panel, nextOpen);
}

function handlePreviewNavigationClick(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const scrollTrigger = target.closest("[data-blockpages-preview-scroll]");
  if (scrollTrigger instanceof HTMLElement) {
    const sectionId = scrollTrigger.getAttribute("data-blockpages-preview-scroll");
    if (!sectionId) return;

    event.preventDefault();
    event.stopPropagation();
    scrollBlockpagesPreviewToSection(sectionId, scrollTrigger.ownerDocument);
    closePreviewMenus(scrollTrigger.ownerDocument);
    return;
  }

  const link = target.closest("a[href^='#']");
  if (link instanceof HTMLAnchorElement) {
    const hash = link.getAttribute("href")?.slice(1).trim();
    if (!hash) return;

    event.preventDefault();
    event.stopPropagation();
    scrollBlockpagesPreviewToSection(hash, link.ownerDocument);
    closePreviewMenus(link.ownerDocument);
  }
}

export function prepareBlockpagesPreviewMenus(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".portfolio-mobile-menu-btn").forEach((button) => {
    button.setAttribute("data-blockpages-preview-menu-toggle", "true");
    const panel =
      button.ownerDocument?.querySelector(".portfolio-mobile-menu") ?? root.querySelector(".portfolio-mobile-menu");
    panel?.setAttribute("data-blockpages-preview-menu-panel", "true");
  });

  root.querySelectorAll<HTMLElement>("[data-blockpages-interactive='true'][aria-controls]").forEach((button) => {
    button.setAttribute("data-blockpages-preview-menu-toggle", "true");
    const controlsId = button.getAttribute("aria-controls");
    if (!controlsId) return;
    const escapedId =
      typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(controlsId) : controlsId.replace(/"/g, '\\"');
    const controlled = root.querySelector<HTMLElement>(`#${escapedId}`);
    if (!controlled) return;
    if (controlled.classList.contains("buyscreen-categories-list")) {
      controlled.setAttribute("data-blockpages-preview-menu-panel", "true");
      return;
    }
    const panel =
      controlled.closest<HTMLElement>(".overflow-hidden, .portfolio-mobile-menu") ?? controlled;
    panel.setAttribute("data-blockpages-preview-menu-panel", "true");
  });

  root.querySelectorAll<HTMLElement>("#construction-mobile-nav, #restaurant-mobile-nav").forEach((panel) => {
    panel.setAttribute("data-blockpages-preview-menu-panel", "true");
    if (panel.classList.contains("hidden")) {
      panel.setAttribute("aria-hidden", "true");
    }
  });

  root.querySelectorAll<HTMLElement>("#blog-mobile-nav").forEach((panel) => {
    panel.setAttribute("data-blockpages-preview-menu-panel", "true");
    const wrapper = panel.closest<HTMLElement>(".overflow-hidden");
    if (wrapper) {
      wrapper.setAttribute("data-blockpages-preview-menu-panel", "true");
    }
  });

  root.querySelectorAll<HTMLElement>("#dm-mobile-nav").forEach((panel) => {
    const wrapper = panel.parentElement;
    if (wrapper) {
      wrapper.setAttribute("data-blockpages-preview-menu-panel", "true");
    }
  });
}

export function bindBlockpagesPreviewInteractions(doc: Document = document) {
  const win = doc.defaultView;
  if (!win) return () => {};

  const boundWindow = win as Window & {
    __blockpagesPreviewInteractionsBound?: boolean;
  };

  if (boundWindow.__blockpagesPreviewInteractionsBound) {
    return () => {};
  }

  boundWindow.__blockpagesPreviewInteractionsBound = true;

  const menuHandler = (event: Event) => handlePreviewMenuClick(event);
  const navigationHandler = (event: Event) => handlePreviewNavigationClick(event);

  doc.addEventListener("click", menuHandler, true);
  doc.addEventListener("click", navigationHandler, true);

  return () => {
    doc.removeEventListener("click", menuHandler, true);
    doc.removeEventListener("click", navigationHandler, true);
    boundWindow.__blockpagesPreviewInteractionsBound = false;
  };
}
