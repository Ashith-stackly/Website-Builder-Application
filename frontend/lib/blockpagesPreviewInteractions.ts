import { scrollBlockpagesCanvasToSection } from "@/lib/blockpagesTemplateSections";

const OPEN_MAX_HEIGHT = ["max-h-[800px]", "max-h-96", "max-h-48", "max-h-40", "max-h-[75vh]"];
const CLOSED_MAX_HEIGHT = ["max-h-0"];

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

function isMenuOpen(doc: Document, button: Element, panel: HTMLElement) {
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

function handlePreviewSectionClick(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest("button");
  if (!button || isPreviewMenuToggle(button)) return;

  const header = button.closest("[data-blockpages-template-header='true'], header");
  if (!header) return;

  const onClick = button.getAttribute("onclick");
  if (onClick) return;

  const sectionId =
    button.getAttribute("data-blockpages-section-id") ??
    (() => {
      const hash = button.getAttribute("data-hash") ?? "";
      return hash.replace(/^#/, "");
    })();

  if (!sectionId) return;

  event.preventDefault();
  scrollBlockpagesCanvasToSection(sectionId);

  const doc = button.ownerDocument;
  doc.querySelectorAll<HTMLElement>("[data-blockpages-preview-menu-panel='true'], .portfolio-mobile-menu, #construction-mobile-nav, #restaurant-mobile-nav, .buyscreen-categories-list").forEach((panel) => {
    const toggle =
      doc.querySelector<HTMLElement>(`[aria-controls="${panel.id}"]`) ??
      doc.querySelector<HTMLElement>(".portfolio-mobile-menu-btn");
    if (toggle) {
      setMenuOpen(toggle, panel, false);
    }
  });
}

export function prepareBlockpagesPreviewMenus(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".portfolio-mobile-menu-btn").forEach((button) => {
    button.setAttribute("data-blockpages-preview-menu-toggle", "true");
    const panel = button.ownerDocument?.querySelector(".portfolio-mobile-menu") ?? root.querySelector(".portfolio-mobile-menu");
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
      controlled.closest<HTMLElement>(".overflow-hidden, .portfolio-mobile-menu") ??
      controlled;
    panel.setAttribute("data-blockpages-preview-menu-panel", "true");
  });

  root.querySelectorAll<HTMLElement>("#construction-mobile-nav, #restaurant-mobile-nav").forEach((panel) => {
    panel.setAttribute("data-blockpages-preview-menu-panel", "true");
    if (panel.classList.contains("hidden")) {
      panel.setAttribute("aria-hidden", "true");
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
    __blockpagesPreviewMenuHandler?: (event: Event) => void;
    __blockpagesPreviewSectionHandler?: (event: Event) => void;
  };

  if (boundWindow.__blockpagesPreviewInteractionsBound) {
    return () => {};
  }

  boundWindow.__blockpagesPreviewInteractionsBound = true;

  const menuHandler = (event: Event) => handlePreviewMenuClick(event);
  const sectionHandler = (event: Event) => handlePreviewSectionClick(event);

  boundWindow.__blockpagesPreviewMenuHandler = menuHandler;
  boundWindow.__blockpagesPreviewSectionHandler = sectionHandler;

  doc.addEventListener("click", menuHandler, true);
  doc.addEventListener("click", sectionHandler, true);

  return () => {
    doc.removeEventListener("click", menuHandler, true);
    doc.removeEventListener("click", sectionHandler, true);
    boundWindow.__blockpagesPreviewInteractionsBound = false;
    delete boundWindow.__blockpagesPreviewMenuHandler;
    delete boundWindow.__blockpagesPreviewSectionHandler;
  };
}
