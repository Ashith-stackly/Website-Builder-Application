import type { TextBlockState, TextTemplateType } from "@/app/blockpages/textblock/types";
import type { AppliedDivider } from "@/lib/blockPagesDraftApi";

export const TEXTBLOCK_PREVIEW_STORAGE_KEY = "stackly-textblock-preview-html";

export const BLOCKPAGES_REQUEST_PREVIEW_EVENT = "blockpages-request-preview";

export function getBlockpagesStorageKey(suffix: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/^\/+|\/+$/g, "");
  return basePath ? `stackly-${basePath}-${suffix}` : suffix;
}

export function readBlockpagesStorageItem(suffix: string) {
  if (typeof window === "undefined") return null;

  const namespacedKey = getBlockpagesStorageKey(suffix);
  const namespacedValue = window.localStorage.getItem(namespacedKey);
  if (namespacedValue !== null) return namespacedValue;

  return window.localStorage.getItem(suffix);
}

export function writeBlockpagesStorageItem(suffix: string, value: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getBlockpagesStorageKey(suffix), value);
  } catch {
    // Ignore quota errors.
  }
}

export function getBlockpagesPreviewSnapshotKey(template: TextTemplateType) {
  return `textblock-preview-snapshot-${template}`;
}

export function getBlockpagesAppliedDividersKey(template: TextTemplateType) {
  return `stackly-custom-dividers-${template}`;
}

export function getBlockpagesAppliedIconsKey(template: TextTemplateType) {
  return `stackly-custom-icons-${template}`;
}

const LEGACY_APPLIED_DIVIDERS_KEY = "stackly-custom-dividers";
const LEGACY_APPLIED_ICONS_KEY = "stackly-custom-icons";

type StoredAppliedDivider = {
  id?: string;
  props?: AppliedDivider["props"];
  position?: AppliedDivider["position"] & {
    sectionId?: string;
    anchorPath?: number[];
    insertMode?: "after" | "before";
  };
  scale?: number;
};

function normalizeStoredAppliedDividers(parsed: unknown): StoredAppliedDivider[] {
  if (Array.isArray(parsed)) return parsed as StoredAppliedDivider[];
  if (parsed && typeof parsed === "object") return [{ id: "legacy", props: parsed as AppliedDivider["props"] }];
  return [];
}

function dedupeStoredAppliedDividers(dividers: StoredAppliedDivider[]): AppliedDivider[] {
  const seenIds = new Set<string>();
  const deduped: AppliedDivider[] = [];

  for (const divider of dividers) {
    const id = typeof divider.id === "string" ? divider.id.trim() : "";
    if (!id || !divider.props || seenIds.has(id)) continue;

    const top = divider.position?.top ?? 0;
    const left = divider.position?.left ?? 16;
    const overlapsExisting = deduped.some((existing) => {
      const existingTop = existing.position?.top ?? 0;
      const existingLeft = existing.position?.left ?? 16;
      return Math.abs(existingTop - top) < 8 && Math.abs(existingLeft - left) < 8;
    });
    if (overlapsExisting) continue;

    seenIds.add(id);
    deduped.push({
      id,
      props: divider.props,
      position: divider.position,
      scale: divider.scale,
    });
  }

  return deduped;
}

/** Remove divider overlay/preview artifacts accidentally baked into template HTML. */
export function scrubDividerArtifactsFromHtml(html: string) {
  if (!html.trim()) return html;
  if (typeof document === "undefined") return html;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  wrapper
    .querySelectorAll(
      '[data-blockpages-preview-divider="true"], [data-blockpages-overlay-kind="divider"], [data-blockpages-overlay-toolbar="true"]'
    )
    .forEach((node) => node.remove());

  return wrapper.innerHTML;
}

const REMOVED_ECOMMERCE_SECTION_IDS = ["buyscreen-video"];

function normalizeEcommerceNavLabel(label: string) {
  return label.replace(/\s+/g, " ").trim().toLowerCase();
}

function isRetiredEcommerceNavLabel(label: string) {
  const normalized = normalizeEcommerceNavLabel(label);
  return normalized === "video block" || normalized.startsWith("video block ");
}

function scrubEcommerceRetiredNavLabels(root: ParentNode) {
  const selectors = [
    ".buyscreen-category-item",
    ".buyscreen-top-header-nav-item",
    "nav.buyscreen-categories button",
    "nav.buyscreen-categories a",
    ".buyscreen-categories-list button",
    ".buyscreen-categories-list a",
    ".buyscreen-top-header-mobile-row button",
    ".buyscreen-top-header-mobile-row a",
  ].join(", ");

  root.querySelectorAll(selectors).forEach((node) => {
    const label = node.textContent ?? "";
    if (isRetiredEcommerceNavLabel(label)) node.remove();
  });
}

function scrubEcommerceRetiredSections(root: ParentNode) {
  for (const sectionId of REMOVED_ECOMMERCE_SECTION_IDS) {
    const escaped =
      typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(sectionId) : sectionId.replace(/"/g, '\\"');
    root.querySelectorAll(`#${escaped}, section[id="${escaped}"]`).forEach((node) => node.remove());
  }

  root.querySelectorAll("section.buyscreen-deal-banner, .buyscreen-deal-banner").forEach((node) => node.remove());
}

const ECOMMERCE_CATEGORY_NAV_CLASS_BLOCKLIST =
  /\s!?bg-transparent|\s!?border-0|\s!?shadow-none|\s!?ring-0|\shover:!?bg-transparent|\shover:!?text-white|\sfocus:!?bg-transparent|\sfocus:!?text-white|\sactive:!?bg-transparent|\sactive:!?text-white|\sfocus-visible:!?bg-transparent|\sfocus-visible:!?text-white/g;

function normalizeEcommerceCategoryNavButton(button: HTMLElement) {
  button.setAttribute("data-blockpages-interactive", "true");
  button.removeAttribute("contenteditable");
  button.classList.remove("editable-text-active");
  button.style.removeProperty("background");
  button.style.removeProperty("background-color");

  if (button.className) {
    button.className = button.className.replace(ECOMMERCE_CATEGORY_NAV_CLASS_BLOCKLIST, "").replace(/\s+/g, " ").trim();
  }

  if (!button.classList.contains("buyscreen-category-item")) {
    button.classList.add("buyscreen-category-item");
  }
}

function normalizeEcommerceCategoryNavButtons(root: ParentNode) {
  root
    .querySelectorAll<HTMLElement>(
      "nav.buyscreen-categories .buyscreen-category-item, nav.buyscreen-categories .buyscreen-categories-list > button"
    )
    .forEach((button) => {
      if (button.closest(".buyscreen-all-categories-dropdown")) return;
      if (button.classList.contains("buyscreen-all-categories-item")) return;
      normalizeEcommerceCategoryNavButton(button);
    });
}

/** String fallback for persisted HTML that predates current nav class names. */
function scrubEcommerceRetiredChromeFromHtmlString(html: string) {
  let next = html;

  next = next.replace(/<section\b[^>]*\bid\s*=\s*["']buyscreen-video["'][^>]*>[\s\S]*?<\/section>/gi, "");
  next = next.replace(/<button\b[^>]*>[\s\S]*?\bVideo\s*Block\b[\s\S]*?<\/button>/gi, "");
  next = next.replace(/<a\b[^>]*>[\s\S]*?\bVideo\s*Block\b[\s\S]*?<\/a>/gi, "");

  return next;
}

/** Remove retired ecommerce chrome from a live canvas (after HTML snapshot restore). */
export function scrubEcommerceRetiredChrome(root: ParentNode | null) {
  if (!root || typeof document === "undefined") return;

  scrubEcommerceRetiredSections(root);
  scrubEcommerceRetiredNavLabels(root);
  normalizeEcommerceCategoryNavButtons(root);
}

export function scrubAndPersistEcommerceCanvas(container: ParentNode | null) {
  if (!container || typeof document === "undefined") return false;

  const templateRoot = getCanvasTemplateRoot(container);
  if (!templateRoot) return false;

  const before = captureCanvasContent(container);
  scrubEcommerceRetiredChrome(templateRoot);
  const after = captureCanvasContent(container);

  if (before === after) return false;
  if (!isPersistedCanvasHtmlValid("ecommerce", after)) return false;

  persistCanvasHtml("ecommerce", after);
  return true;
}

function isRetiredPortfolioHeaderActionLabel(label: string) {
  const normalized = label.replace(/\s+/g, " ").trim().toLowerCase();
  return normalized === "save draft" || normalized.startsWith("preview");
}

/** Remove Save Draft / Preview chrome from portfolio template header nav. */
export function scrubPortfolioRetiredHeaderActions(root: ParentNode | null) {
  if (!root || typeof document === "undefined") return;

  root
    .querySelectorAll(
      '.portfolio-shell [data-blockpages-template-header="true"] [data-builder-chrome="true"], .portfolio-shell [data-blockpages-template-header="true"] [data-builder-chrome="true"] button'
    )
    .forEach((node) => node.remove());

  root
    .querySelectorAll('.portfolio-shell [data-blockpages-template-header="true"] button')
    .forEach((node) => {
      const label = node.textContent ?? "";
      if (isRetiredPortfolioHeaderActionLabel(label)) node.remove();
    });
}

function scrubPortfolioRetiredHeaderActionsFromHtmlString(html: string) {
  let next = html;
  next = next.replace(
    /<div\b[^>]*data-builder-chrome="true"[^>]*>[\s\S]*?\bSave Draft\b[\s\S]*?<\/div>/gi,
    ""
  );
  next = next.replace(/<button\b[^>]*>[\s\S]*?\bSave Draft\b[\s\S]*?<\/button>/gi, "");
  next = next.replace(/<button\b[^>]*>[\s\S]*?\bPreview\b[\s\S]*?<\/button>/gi, "");
  return next;
}

/** Strip retired template sections from persisted canvas HTML (prevents refresh resurrection). */
export function scrubRemovedTemplateSectionsFromHtml(html: string, template: TextTemplateType) {
  let cleaned = scrubDividerArtifactsFromHtml(html);
  if (!cleaned.trim() || typeof document === "undefined") return cleaned;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = cleaned;

  if (template === "ecommerce") {
    scrubEcommerceRetiredChrome(wrapper);

    let cleanedHtml = wrapper.innerHTML;
    if (cleanedHtml.includes("Video Block") || cleanedHtml.includes("buyscreen-video")) {
      cleanedHtml = scrubEcommerceRetiredChromeFromHtmlString(cleanedHtml);
    }
    return cleanedHtml;
  }

  if (template === "portfolio") {
    scrubPortfolioRetiredHeaderActions(wrapper);
    let cleanedHtml = wrapper.innerHTML;
    if (cleanedHtml.includes("Save Draft") || cleanedHtml.includes("Preview")) {
      cleanedHtml = scrubPortfolioRetiredHeaderActionsFromHtmlString(cleanedHtml);
    }
    return cleanedHtml;
  }

  return cleaned;
}

function migratePersistedCanvasHtml(template: TextTemplateType, raw: string, cleaned: string) {
  if (cleaned === raw || typeof window === "undefined") return;

  try {
    writeBlockpagesStorageItem(getTextBlockCanvasStorageKey(template), cleaned);
    window.localStorage.setItem(getTextBlockCanvasStorageKey(template), cleaned);
  } catch {
    // Ignore quota errors.
  }
}

export function normalizePersistedTextBlockState(
  template: TextTemplateType,
  state: TextBlockState
): TextBlockState {
  if (template !== "ecommerce") return state;

  let nextState = state;

  if (state.activeSectionId && REMOVED_ECOMMERCE_SECTION_IDS.includes(state.activeSectionId)) {
    nextState = { ...nextState, activeSectionId: "buyscreen-products" };
  }

  if (state.sectionStyles && REMOVED_ECOMMERCE_SECTION_IDS.some((id) => id in state.sectionStyles!)) {
    const sectionStyles = { ...state.sectionStyles };
    for (const sectionId of REMOVED_ECOMMERCE_SECTION_IDS) {
      delete sectionStyles[sectionId];
    }
    nextState = { ...nextState, sectionStyles };
  }

  return nextState;
}

export function loadAppliedDividersForTemplate(template: TextTemplateType): AppliedDivider[] {
  const raw = readBlockpagesStorageItem(getBlockpagesAppliedDividersKey(template));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return dedupeStoredAppliedDividers(normalizeStoredAppliedDividers(parsed));
  } catch {
    return [];
  }
}

export function loadAppliedIconsForTemplate(template: TextTemplateType) {
  const namespaced = readBlockpagesStorageItem(getBlockpagesAppliedIconsKey(template));
  const raw = namespaced ?? readBlockpagesStorageItem(LEGACY_APPLIED_ICONS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length > 0 ? parsed : [];
    if (parsed) return [{ id: "legacy", props: parsed }];
  } catch {
    return [];
  }

  return [];
}

export function persistAppliedDividersForTemplate(template: TextTemplateType, dividers: unknown[]) {
  const json = JSON.stringify(dividers);
  writeBlockpagesStorageItem(getBlockpagesAppliedDividersKey(template), json);

  if (typeof window === "undefined") return;

  try {
    // Keep unprefixed template key in sync for older builds on the same origin.
    window.localStorage.setItem(getBlockpagesAppliedDividersKey(template), json);
    // Global legacy key resurrected stale dividers across templates in production.
    window.localStorage.removeItem(LEGACY_APPLIED_DIVIDERS_KEY);
  } catch {
    // Ignore quota errors.
  }
}

export function persistAppliedIconsForTemplate(template: TextTemplateType, icons: unknown[]) {
  writeBlockpagesStorageItem(getBlockpagesAppliedIconsKey(template), JSON.stringify(icons));
}

export function getTextBlockStateStorageKey(template: TextTemplateType) {
  return `stackly-textblock-state-${template}`;
}

export function getTextBlockCanvasStorageKey(template: TextTemplateType) {
  return `stackly-textblock-canvas-html-${template}`;
}

export function loadPersistedTextBlockState(template: TextTemplateType): TextBlockState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getTextBlockStateStorageKey(template));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TextBlockState;
    return normalizePersistedTextBlockState(template, parsed);
  } catch {
    return null;
  }
}

export function persistTextBlockState(template: TextTemplateType, state: TextBlockState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getTextBlockStateStorageKey(template), JSON.stringify(state));
  } catch {
    // Ignore quota errors.
  }
}

export function loadPersistedCanvasHtml(template: TextTemplateType): string | null {
  if (typeof window === "undefined") return null;

  const raw =
    readBlockpagesStorageItem(getTextBlockCanvasStorageKey(template)) ??
    window.localStorage.getItem(getTextBlockCanvasStorageKey(template));
  if (!raw) return null;

  const cleaned = scrubRemovedTemplateSectionsFromHtml(raw, template);
  migratePersistedCanvasHtml(template, raw, cleaned);
  return cleaned;
}

export function persistCanvasHtml(template: TextTemplateType, html: string) {
  if (typeof window === "undefined" || !html.trim()) return;

  const cleaned = scrubRemovedTemplateSectionsFromHtml(html, template);
  if (!isPersistedCanvasHtmlValid(template, cleaned)) return;

  try {
    writeBlockpagesStorageItem(getTextBlockCanvasStorageKey(template), cleaned);
    window.localStorage.setItem(getTextBlockCanvasStorageKey(template), cleaned);
  } catch {
    // Ignore quota errors.
  }
}

const TEMPLATE_CANVAS_MARKERS: Partial<Record<TextTemplateType, string[]>> = {
  portfolio: ["portfolio-shell"],
  ecommerce: ["buyscreen-page", "buyscreen-header"],
  blog: ["blog-blockpages-root", "blog-page"],
  construction: ["construction-shell"],
  restaurant: ["restaurant-shell"],
  "digital-marketing": ["dm-shell"],
  business: ["dm-shell"],
};

/** Templates whose canvas is a live React tree (not HTML snapshot restore). */
export function templateUsesHtmlCanvasPersistence(template: TextTemplateType) {
  return template === "portfolio" || template === "ecommerce";
}

export function isPersistedCanvasHtmlValid(template: TextTemplateType, html: string) {
  if (!html.trim()) return false;
  if (!templateUsesHtmlCanvasPersistence(template)) return false;

  const markers = TEMPLATE_CANVAS_MARKERS[template];
  if (!markers?.length) return html.length > 200;

  return markers.some((marker) => html.includes(marker));
}

export function clearPersistedCanvasHtml(template: TextTemplateType) {
  if (typeof window === "undefined") return;

  const suffix = getTextBlockCanvasStorageKey(template);

  try {
    window.localStorage.removeItem(getBlockpagesStorageKey(suffix));
    window.localStorage.removeItem(suffix);
  } catch {
    // Ignore quota errors.
  }
}

export function getCanvasContentRoot(container: ParentNode | null): HTMLElement | null {
  return container?.querySelector<HTMLElement>("[data-textblock-canvas]") ?? null;
}

export function getCanvasTemplateRoot(container: ParentNode | null): HTMLElement | null {
  const canvas = getCanvasContentRoot(container);
  return canvas?.querySelector<HTMLElement>("[data-blockpages-template-root]") ?? canvas;
}

export function captureCanvasContent(container: ParentNode | null): string {
  const root = getCanvasTemplateRoot(container);
  return root?.innerHTML ?? "";
}

export function applyCanvasContent(container: ParentNode | null, html: string) {
  const root = getCanvasTemplateRoot(container);
  if (!root || !html.trim()) return;

  const scrollRoot = getCanvasContentRoot(container);
  const savedScrollTop = scrollRoot?.scrollTop ?? 0;
  const savedScrollLeft = scrollRoot?.scrollLeft ?? 0;

  root.innerHTML = html;

  if (scrollRoot) {
    scrollRoot.scrollTop = savedScrollTop;
    scrollRoot.scrollLeft = savedScrollLeft;
  }
}

export const BLOCKPAGES_CANVAS_RESTORED_EVENT = "blockpages-canvas-restored";

export function getHiddenElementsStorageKey(template: TextTemplateType) {
  return `stackly-blockpages-hidden-elements-${template}`;
}

const TEMPLATE_REMOVABLE_ELEMENT_IDS: Partial<Record<TextTemplateType, string[]>> = {
  ecommerce: ["buyscreen-user-account"],
};

export function getTemplateRemovableElementIds(template: TextTemplateType): string[] {
  return TEMPLATE_REMOVABLE_ELEMENT_IDS[template] ?? [];
}

export function loadHiddenElements(template: TextTemplateType): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getHiddenElementsStorageKey(template));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export function persistHiddenElements(template: TextTemplateType, elementIds: string[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getHiddenElementsStorageKey(template), JSON.stringify(elementIds));
  } catch {
    // Ignore quota errors.
  }
}

export function markHiddenElement(template: TextTemplateType, elementId: string) {
  const hidden = loadHiddenElements(template);
  if (hidden.includes(elementId)) return false;
  persistHiddenElements(template, [...hidden, elementId]);
  dispatchHiddenElementsChangedEvent();
  return true;
}

export function unmarkHiddenElement(template: TextTemplateType, elementId: string) {
  const hidden = loadHiddenElements(template);
  if (!hidden.includes(elementId)) return false;
  persistHiddenElements(
    template,
    hidden.filter((id) => id !== elementId)
  );
  dispatchHiddenElementsChangedEvent();
  return true;
}

export function syncHiddenElementsFromCanvas(container: ParentNode | null, template: TextTemplateType) {
  const root = getCanvasContentRoot(container);
  if (!root) return false;

  let changed = false;
  const hidden = new Set(loadHiddenElements(template));

  for (const elementId of getTemplateRemovableElementIds(template)) {
    const exists = root.querySelector(`[data-blockpages-element-id="${elementId}"]`);
    if (!exists && !hidden.has(elementId)) {
      hidden.add(elementId);
      changed = true;
    }
  }

  if (changed) {
    persistHiddenElements(template, Array.from(hidden));
    dispatchHiddenElementsChangedEvent();
  }

  return changed;
}

export function inferHiddenElementsFromCanvasHtml(template: TextTemplateType, html: string) {
  if (!html.trim()) return false;

  const hidden = new Set(loadHiddenElements(template));
  let changed = false;

  for (const elementId of getTemplateRemovableElementIds(template)) {
    if (!html.includes(`data-blockpages-element-id="${elementId}"`)) {
      if (!hidden.has(elementId)) changed = true;
      hidden.add(elementId);
    }
  }

  if (changed) {
    persistHiddenElements(template, Array.from(hidden));
    dispatchHiddenElementsChangedEvent();
  }

  return changed;
}

export function applyHiddenElementsToCanvas(container: ParentNode | null, template: TextTemplateType) {
  const root = getCanvasContentRoot(container);
  if (!root) return;

  for (const elementId of loadHiddenElements(template)) {
    root.querySelectorAll(`[data-blockpages-element-id="${elementId}"]`).forEach((node) => {
      node.remove();
    });
  }
}

export const BLOCKPAGES_HIDDEN_ELEMENTS_CHANGED_EVENT = "blockpages-hidden-elements-changed";

export function dispatchHiddenElementsChangedEvent() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BLOCKPAGES_HIDDEN_ELEMENTS_CHANGED_EVENT));
}

export function buildHiddenElementsCss(template: TextTemplateType, hiddenIds?: string[]) {
  const hidden = hiddenIds ?? loadHiddenElements(template);
  if (!hidden.length) return "";

  const hideRule =
    "display: none !important; visibility: hidden !important; pointer-events: none !important;";

  const elementRules = hidden
    .map((elementId) => {
      const escaped =
        typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(elementId) : elementId.replace(/"/g, '\\"');
      return `[data-textblock-canvas] [data-blockpages-element-id="${escaped}"] { ${hideRule} }`;
    })
    .join("\n");

  const dividerRule = hidden.includes("buyscreen-user-account")
    ? `[data-textblock-canvas] [data-blockpages-user-account-divider] { ${hideRule} }`
    : "";

  return [elementRules, dividerRule].filter(Boolean).join("\n");
}

export function dispatchCanvasRestoredEvent() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BLOCKPAGES_CANVAS_RESTORED_EVENT));
}
