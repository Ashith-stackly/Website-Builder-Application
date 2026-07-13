const BLOCKPAGES_CARD_SELECTOR_LIST = [
  ".portfolio-stat-card",
  ".portfolio-mini-card",
  ".portfolio-process-card",
  ".portfolio-service-card",
  ".portfolio-project-card",
  ".portfolio-reveal.bg-white.p-6",
  ".buyscreen-product-card",
  ".buyscreen-category-card",
  ".buyscreen-step-card",
  ".buyscreen-testimonial-card",
  ".buyscreen-brand-tile",
  ".buyscreen-update-product",
  ".blockpages-card",
  '[data-blockpages-card="true"]',
] as const;

function withCanvasScope(selectors: readonly string[]) {
  return selectors.map((selector) => `[data-textblock-canvas] ${selector}`).join(",\n");
}

const BLOCKPAGES_CARD_SELECTORS = withCanvasScope(BLOCKPAGES_CARD_SELECTOR_LIST);

export function buildBlockpagesCardShadowCss(enabled: boolean) {
  if (enabled) {
    return `
      ${BLOCKPAGES_CARD_SELECTORS} {
        box-shadow: 0 15px 35px -5px color-mix(in srgb, currentColor 15%, transparent), 0 5px 15px -5px color-mix(in srgb, currentColor 10%, transparent) !important;
      }
      ${withCanvasScope(BLOCKPAGES_CARD_SELECTOR_LIST.map((selector) => `${selector}:hover`))} {
        box-shadow: 0 25px 50px -12px color-mix(in srgb, currentColor 25%, transparent) !important;
      }
    `;
  }

  return `
    ${BLOCKPAGES_CARD_SELECTORS} {
      box-shadow: none !important;
    }
  `;
}
