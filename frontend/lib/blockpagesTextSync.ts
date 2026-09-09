const TEXT_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "SPAN",
  "LI",
  "LABEL",
  "A",
  "BUTTON",
  "BLOCKQUOTE",
]);

export function cleanCorruptedHtmlEntities(text: string): string {
  if (!text) return text;
  let val = text;
  let safety = 0;
  while ((val.includes("&amp;amp;") || val.includes("&amp;lt;")) && safety < 10) {
    val = val.replace(/&amp;amp;/g, "&amp;").replace(/&amp;lt;/g, "&lt;").replace(/&amp;gt;/g, "&gt;");
    safety++;
  }
  if (val.includes("&lt;") && val.includes("&gt;")) {
    val = val.replace(/&lt;br\s*\/?&gt;/gi, "<br>");
  }
  return val;
}

/**
 * Deterministically traverses the canvas container, stamps stable IDs on all text elements,
 * and applies saved customTexts overrides immediately without waiting for user interaction.
 *
 * CRITICAL: Never touches the innerHTML of any element that is actively focused or being edited.
 */
export function syncCanvasTexts(
  container: HTMLElement | null,
  template: string,
  customTexts?: Record<string, string> | null,
  activeEditableNode?: HTMLElement | null
): void {
  if (!container) return;

  const activeElement = typeof document !== "undefined" ? document.activeElement : null;

  let counter = 0;

  const walk = (node: Element) => {
    if (node.closest("[data-builder-chrome='true']")) return;
    if (node.closest('[data-blockpages-interactive="true"], .buyscreen-search, input, textarea, select')) return;
    if (node.closest("[data-blockpages-button-id]")) return;
    if (node.closest("[data-blockpages-custom-icon-mount='true'], [data-blockpages-icon-slot='true'], [data-blockpages-icon-id]")) return;
    if (node.tagName.toLowerCase() === "svg" || node.closest("svg")) return;

    if (
      node instanceof HTMLElement &&
      node.tagName === "BUTTON" &&
      node.closest("nav.buyscreen-categories") &&
      (node.classList.contains("buyscreen-category-item") ||
        node.classList.contains("buyscreen-all-categories-toggle") ||
        node.classList.contains("buyscreen-all-categories-item"))
    ) {
      const htmlNode = node as HTMLElement;
      if (htmlNode.querySelector("svg")) {
        Array.from(node.children).forEach(walk);
        return;
      }
      const textId = htmlNode.getAttribute("data-blockpages-text-id") || `txt-${template}-nav-${counter++}`;
      htmlNode.setAttribute("data-blockpages-text-id", textId);

      if (!htmlNode.hasAttribute("data-blockpages-default-text")) {
        htmlNode.setAttribute("data-blockpages-default-text", htmlNode.innerHTML);
      }

      const isEditing =
        Boolean(activeEditableNode && (activeEditableNode === htmlNode || activeEditableNode.contains(htmlNode) || htmlNode.contains(activeEditableNode))) ||
        Boolean(activeElement && (activeElement === htmlNode || htmlNode.contains(activeElement)));

      if (!isEditing) {
        if (customTexts && typeof customTexts[textId] === "string") {
          const cleaned = cleanCorruptedHtmlEntities(customTexts[textId]);
          if (htmlNode.innerHTML !== cleaned) {
            htmlNode.innerHTML = cleaned;
          }
        } else {
          const defaultText = htmlNode.getAttribute("data-blockpages-default-text");
          if (defaultText !== null && htmlNode.innerHTML !== defaultText) {
            htmlNode.innerHTML = defaultText;
          }
        }
      }

      Array.from(node.children).forEach(walk);
      return;
    }

    if (TEXT_TAGS.has(node.tagName)) {
      const htmlNode = node as HTMLElement;
      if (
        htmlNode.hasAttribute("data-blockpages-custom-icon-mount") ||
        htmlNode.hasAttribute("data-blockpages-icon-id") ||
        htmlNode.hasAttribute("data-blockpages-icon-slot")
      ) {
        return;
      }
      if (htmlNode.querySelector("svg, [data-blockpages-custom-icon-mount]")) {
        Array.from(node.children).forEach(walk);
        return;
      }
      const textId = htmlNode.getAttribute("data-blockpages-text-id") || `txt-${template}-${node.tagName.toLowerCase()}-${counter++}`;
      htmlNode.setAttribute("data-blockpages-text-id", textId);

      if (!htmlNode.hasAttribute("data-blockpages-default-text")) {
        htmlNode.setAttribute("data-blockpages-default-text", htmlNode.innerHTML);
      }

      const isEditing =
        Boolean(activeEditableNode && (activeEditableNode === htmlNode || activeEditableNode.contains(htmlNode) || htmlNode.contains(activeEditableNode))) ||
        Boolean(activeElement && (activeElement === htmlNode || htmlNode.contains(activeElement)));

      if (!isEditing) {
        if (customTexts && typeof customTexts[textId] === "string") {
          const cleaned = cleanCorruptedHtmlEntities(customTexts[textId]);
          if (htmlNode.innerHTML !== cleaned) {
            htmlNode.innerHTML = cleaned;
          }
        } else {
          const defaultText = htmlNode.getAttribute("data-blockpages-default-text");
          if (defaultText !== null && htmlNode.innerHTML !== defaultText) {
            htmlNode.innerHTML = defaultText;
          }
        }
      }
    }

    Array.from(node.children).forEach(walk);
  };

  walk(container);
}
