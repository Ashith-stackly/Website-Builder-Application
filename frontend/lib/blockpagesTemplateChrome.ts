import type { TextSectionProps } from "@/app/blockpages/textblock/types";
import { BLOCKPAGES_DROPDOWN_EXCLUDE } from "@/lib/blockpagesDropdownStyles";

export const BLOCKPAGES_TEMPLATE_HEADER_SELECTOR = `[data-textblock-canvas] [data-blockpages-template-header="true"],
[data-textblock-canvas] .portfolio-shell > .sticky,
[data-textblock-canvas] .buyscreen-header,
[data-textblock-canvas] .restaurant-shell header,
[data-textblock-canvas] .construction-shell header,
[data-textblock-canvas] .blog-page header,
[data-textblock-canvas] .blog-blockpages-root header,
[data-textblock-canvas] .dm-shell [data-blockpages-template-header="true"],
[data-textblock-canvas] .dm-shell .sticky`;

export const BLOCKPAGES_TEMPLATE_HEADER_BAR_SELECTOR = `[data-textblock-canvas] [data-blockpages-template-header="true"] > div:first-child,
[data-textblock-canvas] .blog-page header > div:first-child,
[data-textblock-canvas] .blog-blockpages-root header > div:first-child`;

export const BLOCKPAGES_TEMPLATE_HEADER_CHILD_SELECTOR = `[data-textblock-canvas] [data-blockpages-template-header="true"] *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .portfolio-shell > .sticky *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .buyscreen-header *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .buyscreen-categories *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .portfolio-mobile-menu *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .restaurant-shell header *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .construction-shell header *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .blog-page header *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .blog-blockpages-root header *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .dm-shell [data-blockpages-template-header="true"] *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .dm-shell .sticky *${BLOCKPAGES_DROPDOWN_EXCLUDE}`;

export const BLOCKPAGES_TEMPLATE_FOOTER_SELECTOR = `[data-textblock-canvas] [data-blockpages-template-footer="true"],
[data-textblock-canvas] footer,
[data-textblock-canvas] .stackly-footer,
[data-textblock-canvas] .restaurant-shell footer,
[data-textblock-canvas] .construction-shell footer,
[data-textblock-canvas] .blog-page footer,
[data-textblock-canvas] .dm-shell footer`;

export const BLOCKPAGES_TEMPLATE_FOOTER_CHILD_SELECTOR = `[data-textblock-canvas] [data-blockpages-template-footer="true"] *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] footer *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .stackly-footer *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .restaurant-shell footer *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .construction-shell footer *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .blog-page footer *${BLOCKPAGES_DROPDOWN_EXCLUDE},
[data-textblock-canvas] .dm-shell footer *${BLOCKPAGES_DROPDOWN_EXCLUDE}`;

export function buildBlockpagesTemplateChromeCss(section: TextSectionProps) {
  return `
    ${BLOCKPAGES_TEMPLATE_HEADER_SELECTOR} {
      ${section.headerBg ? `background: ${section.headerBg} !important; background-color: ${section.headerBg} !important;` : ""}
      ${section.headerText ? `color: ${section.headerText} !important;` : ""}
    }
    ${BLOCKPAGES_TEMPLATE_HEADER_BAR_SELECTOR} {
      ${section.headerBg ? `background: transparent !important; background-color: transparent !important;` : ""}
    }
    ${BLOCKPAGES_TEMPLATE_HEADER_CHILD_SELECTOR} {
      ${section.headerText ? `color: inherit !important;` : ""}
      ${section.headerFontSize ? `font-size: ${section.headerFontSize}px !important;` : ""}
      ${section.headerFontFamily ? `font-family: ${section.headerFontFamily} !important;` : ""}
      ${section.headerFontWeight ? `font-weight: ${section.headerFontWeight} !important;` : ""}
      ${section.headerLineHeight ? `line-height: ${section.headerLineHeight} !important;` : ""}
      ${section.headerLetterSpacing ? `letter-spacing: ${section.headerLetterSpacing} !important;` : ""}
    }
    [data-textblock-canvas] .portfolio-shell > .sticky span.bg-white {
      ${section.headerText ? `background-color: ${section.headerText} !important;` : ""}
    }
    ${BLOCKPAGES_TEMPLATE_FOOTER_SELECTOR} {
      ${section.footerBg ? `background: ${section.footerBg} !important; background-color: ${section.footerBg} !important;` : ""}
      ${section.footerText ? `color: ${section.footerText} !important;` : ""}
    }
    ${BLOCKPAGES_TEMPLATE_FOOTER_CHILD_SELECTOR} {
      ${section.footerText ? `color: inherit !important;` : ""}
    }
  `;
}
