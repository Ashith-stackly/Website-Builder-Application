/** Descendant selector: skip dropdown flyout panels and header CTA buttons. */
export const BLOCKPAGES_DROPDOWN_EXCLUDE =
  ':not(:is([data-blockpages-dropdown-panel="true"], [data-blockpages-dropdown-panel="true"] *, [data-blockpages-header-cta="true"], [data-blockpages-header-cta="true"] *))';

export function isBlockpagesTextEditingActive() {
  if (typeof document === "undefined") return false;
  return Boolean(document.querySelector('[data-blockpages-text-editing="true"]'));
}

export function mutationIsInsideContentEditable(mutation: MutationRecord) {
  const target =
    mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
  return Boolean(target?.closest('[contenteditable="true"]'));
}

export function mutationsAreFromTextEditing(mutations: MutationRecord[]) {
  if (!isBlockpagesTextEditingActive() || mutations.length === 0) return false;
  return mutations.every(mutationIsInsideContentEditable);
}

export function nodeIsInBlockpagesHeaderDropdown(node: Element) {
  const dropdown = node.closest('[data-blockpages-dropdown-panel="true"]');
  if (!dropdown) return false;

  const header = dropdown.closest("header");
  if (header?.closest(".blog-page")) return true;

  return Boolean(
    dropdown.closest(
      ".buyscreen-header, .buyscreen-categories, .restaurant-shell header, .construction-shell header, .dm-shell > .sticky, .dm-shell header"
    )
  );
}

export function nodeIsInBlockpagesHeaderChrome(node: Element) {
  if (node.closest('[data-blockpages-dropdown-panel="true"]')) return false;

  if (node.closest("header")?.closest(".blog-page")) return true;

  return Boolean(
    node.closest(
      "[data-blockpages-template-header='true'], .buyscreen-header, .buyscreen-categories, .portfolio-shell > .sticky, .portfolio-mobile-menu, .restaurant-shell header, .construction-shell header, .dm-shell > .sticky, .dm-shell header"
    )
  );
}

export function nodeIsInBlockpagesFooterChrome(node: Element) {
  return Boolean(
    node.closest(
      "[data-blockpages-template-footer='true'], footer, .stackly-footer, .restaurant-shell footer, .construction-shell footer, .blog-page footer, .blog-blockpages-root footer, .dm-shell footer"
    )
  );
}

/** CSS injected in blockpages text canvas so nav dropdown/flyout panels stay readable. */
export function buildBlockpagesDropdownStylesCss() {
  return `
    [data-textblock-canvas] .buyscreen-header,
    [data-textblock-canvas] .buyscreen-categories,
    [data-textblock-canvas] .buyscreen-all-categories-wrap,
    [data-textblock-canvas] .construction-shell header,
    [data-textblock-canvas] .restaurant-shell header,
    [data-textblock-canvas] [data-blockpages-template-header="true"],
    [data-textblock-canvas] .blog-page header,
    [data-textblock-canvas] .blog-page header nav .relative,
    [data-textblock-canvas] .blog-page header nav .group {
      overflow: visible !important;
    }

    [data-textblock-canvas] .buyscreen-search input {
      color: #111827 !important;
      -webkit-text-fill-color: #111827 !important;
      caret-color: #06224C !important;
      background-color: #ffffff !important;
    }

    [data-textblock-canvas] .buyscreen-search input::placeholder {
      color: #6b7280 !important;
      -webkit-text-fill-color: #6b7280 !important;
      opacity: 1 !important;
    }

    [data-textblock-canvas] nav.buyscreen-categories .buyscreen-category-item:hover,
    [data-textblock-canvas] nav.buyscreen-categories .buyscreen-category-item:focus-visible,
    [data-textblock-canvas] nav.buyscreen-categories .buyscreen-categories-list > button.buyscreen-category-item:hover,
    [data-textblock-canvas] nav.buyscreen-categories .buyscreen-categories-list > button.buyscreen-category-item:focus-visible {
      background: #2563eb !important;
      background-color: #2563eb !important;
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      outline: none !important;
    }

    [data-textblock-canvas] .construction-shell header [data-blockpages-header-cta="true"] {
      color: #0a1e3d !important;
      -webkit-text-fill-color: #0a1e3d !important;
      background-color: #ffffff !important;
    }

    [data-textblock-canvas] .construction-shell header [data-blockpages-header-cta="true"]:hover {
      color: #0a1e3d !important;
      -webkit-text-fill-color: #0a1e3d !important;
      background-color: #f3f4f6 !important;
    }

    [data-textblock-canvas] .group > [data-blockpages-dropdown-panel="true"] {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    [data-textblock-canvas] .group:hover > [data-blockpages-dropdown-panel="true"],
    [data-textblock-canvas] .group:has([data-blockpages-dropdown-panel="true"] .editable-text-active) > [data-blockpages-dropdown-panel="true"] {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    [data-textblock-canvas] .buyscreen-all-categories-dropdown {
      display: block !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    [data-textblock-canvas] .group:hover > .buyscreen-all-categories-dropdown,
    [data-textblock-canvas] .group:has(.buyscreen-all-categories-dropdown .editable-text-active) > .buyscreen-all-categories-dropdown,
    [data-textblock-canvas] .buyscreen-all-categories-dropdown--open {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] {
      background-color: #ffffff !important;
      color: #1f2937 !important;
      overflow: visible !important;
      z-index: 200 !important;
    }

    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"][data-blockpages-dropdown-theme="dark"] {
      background-color: transparent !important;
      color: #ffffff !important;
    }

    [data-textblock-canvas] .buyscreen-all-categories-wrap,
    [data-textblock-canvas] [data-blockpages-dropdown-id="blog-categories"] {
      position: relative !important;
      z-index: 210 !important;
    }

    [data-textblock-canvas] [data-blockpages-dropdown-id="blog-categories"],
    [data-textblock-canvas] [data-blockpages-dropdown-id="blog-mobile-categories"] {
      padding-bottom: 12px;
      margin-bottom: -12px;
    }

    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] .buyscreen-all-categories-item,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] .buyscreen-user-menu-item,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] button,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] p {
      color: #1f2937 !important;
      -webkit-text-fill-color: #1f2937 !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"][data-blockpages-dropdown-theme="dark"] button,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"][data-blockpages-dropdown-theme="dark"] p {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      background-color: transparent !important;
    }

    [data-textblock-canvas] .blog-blockpages-dropdown-panel[data-blockpages-dropdown-theme="light"],
    [data-textblock-canvas] .blog-blockpages-dropdown-panel[data-blockpages-dropdown-theme="light"] button,
    [data-textblock-canvas] .blog-blockpages-dropdown-panel[data-blockpages-dropdown-theme="light"] p {
      color: #001f3f !important;
      -webkit-text-fill-color: #001f3f !important;
      background-color: #ffffff !important;
    }

    [data-textblock-canvas] .blog-blockpages-dropdown-panel[data-blockpages-dropdown-theme="dark"] button,
    [data-textblock-canvas] .blog-blockpages-dropdown-panel[data-blockpages-dropdown-theme="dark"] p {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      background-color: transparent !important;
    }

    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] .buyscreen-all-categories-item:hover,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] .buyscreen-all-categories-item:focus-visible,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] button:hover,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] button:focus-visible {
      color: #1f2937 !important;
      -webkit-text-fill-color: #1f2937 !important;
      background-color: #eff6ff !important;
    }

    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] .text-gray-700,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] button.text-gray-700 {
      color: #374151 !important;
      -webkit-text-fill-color: #374151 !important;
    }

    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] .text-red-600 {
      color: #dc2626 !important;
      -webkit-text-fill-color: #dc2626 !important;
    }

    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] [contenteditable="true"],
    [data-textblock-canvas] .blog-page header [contenteditable="true"],
    [data-textblock-canvas] .buyscreen-categories [contenteditable="true"],
    [data-textblock-canvas] .construction-shell header [contenteditable="true"],
    [data-textblock-canvas] [contenteditable="true"] {
      user-select: text !important;
      -webkit-user-select: text !important;
      cursor: text !important;
      caret-color: auto !important;
    }

    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] .editable-text-active,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] [contenteditable="true"]:focus,
    [data-textblock-canvas] .blog-page header .editable-text-active,
    [data-textblock-canvas] .buyscreen-categories .editable-text-active,
    [data-textblock-canvas] .construction-shell header .editable-text-active {
      outline: 2px dashed #63e5ff !important;
      outline-offset: 2px !important;
      cursor: text !important;
    }

    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] .editable-text-active,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] [contenteditable="true"]:focus,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"] [contenteditable="true"]:hover {
      color: #001f3f !important;
      -webkit-text-fill-color: #001f3f !important;
      background-color: #eaf2ff !important;
    }

    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"][data-blockpages-dropdown-theme="dark"] .editable-text-active,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"][data-blockpages-dropdown-theme="dark"] [contenteditable="true"]:focus,
    [data-textblock-canvas] [data-blockpages-dropdown-panel="true"][data-blockpages-dropdown-theme="dark"] [contenteditable="true"]:hover {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      background-color: rgba(255, 255, 255, 0.12) !important;
    }
  `;
}
