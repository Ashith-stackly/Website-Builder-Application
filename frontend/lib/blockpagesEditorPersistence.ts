import type { TextBlockState, TextTemplateType } from "@/app/blockpages/textblock/types";

export const TEXTBLOCK_PREVIEW_STORAGE_KEY = "stackly-textblock-preview-html";

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
    return JSON.parse(raw) as TextBlockState;
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
  return window.localStorage.getItem(getTextBlockCanvasStorageKey(template));
}

export function persistCanvasHtml(template: TextTemplateType, html: string) {
  if (typeof window === "undefined" || !html.trim()) return;

  try {
    window.localStorage.setItem(getTextBlockCanvasStorageKey(template), html);
  } catch {
    // Ignore quota errors.
  }
}

export function getCanvasContentRoot(container: ParentNode | null): HTMLElement | null {
  return container?.querySelector<HTMLElement>("[data-textblock-canvas]") ?? null;
}

export function captureCanvasContent(container: ParentNode | null): string {
  const root = getCanvasContentRoot(container);
  return root?.innerHTML ?? "";
}

export function applyCanvasContent(container: ParentNode | null, html: string) {
  const root = getCanvasContentRoot(container);
  if (!root || !html.trim()) return;
  root.innerHTML = html;
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
