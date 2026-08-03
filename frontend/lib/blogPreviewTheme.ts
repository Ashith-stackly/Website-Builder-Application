/**
 * Shared Blogify theme tokens + layout CSS for the live blog page and
 * blockpages edit/preview snapshots (styled-jsx often never lands in the clone).
 */

export const BLOG_THEME_CUSTOM_PROPERTIES = `
  --blog-navy: #001f3f;
  --blog-navy-muted: #1a3a5c;
  --blog-blue-bg: #eaf2ff;
  --blog-pink-bg: #fff0f0;
  --blog-accent: #2d8cf0;
  --blog-white: #ffffff;
  --blog-container: 72rem;
  --blog-container-wide: 76rem;
  --blog-section-y: clamp(2.5rem, 7cqw, 5.5rem);
  --blog-section-y-lg: clamp(3rem, 8cqw, 6.5rem);
  --blog-radius-sm: 0.75rem;
  --blog-radius-md: 1rem;
  --blog-radius-lg: 1.25rem;
  --blog-safe-inline: clamp(0.75rem, 4cqw, 3rem);
  --stackly-nav-height: 3.5rem;
  --blog-header-height: 3.25rem;
  --blog-nav-gap: clamp(1rem, 2.5cqw, 1.5rem);
  --blog-header-content-gap: 0;
  --blog-scroll-offset: calc(
    var(--stackly-nav-height-measured, var(--stackly-nav-height)) +
      var(--blog-nav-gap) +
      var(--blog-header-height) +
      0.5rem
  );
  --blog-top-split: 38%;
`.trim();

const BLOG_ROOT_SELECTORS = ".blog-page, .blog-blockpages-root";

/** Full theme CSS suitable for live page + preview viewport injection. */
export function buildBlogThemeCss(rootSelector = BLOG_ROOT_SELECTORS) {
  return `
    ${rootSelector} {
      ${BLOG_THEME_CUSTOM_PROPERTIES}
    }

    ${rootSelector} {
      container-type: inline-size;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    ${rootSelector} *,
    ${rootSelector} *::before,
    ${rootSelector} *::after {
      box-sizing: border-box;
    }

    #blog-categories,
    #blog-trending,
    #blog-about,
    #blog-contact {
      scroll-margin-top: var(--blog-scroll-offset) !important;
    }

    @container (min-width: 768px) {
      ${rootSelector} {
        --stackly-nav-height: 3.75rem;
        --blog-nav-gap: 1.5rem;
      }
    }

    @container (max-width: 639px) {
      ${rootSelector} {
        --blog-safe-inline: clamp(0.65rem, 4cqw, 1.25rem);
        --blog-section-y: clamp(2rem, 6cqw, 3rem);
      }
    }

    @container (min-width: 1024px) {
      .blog-top-zone {
        --blog-top-split: 40%;
      }
    }

    @container (min-width: 1280px) {
      .blog-top-zone {
        --blog-top-split: 42%;
      }
    }
  `;
}

/** Preview-only layout hardening so edit preview matches live framed /blog. */
export function buildBlogPreviewLayoutCss() {
  const root = "[data-blockpages-preview-root]";
  const page = `${root} .blog-page, ${root} .blog-blockpages-root`;

  return `
    ${buildBlogThemeCss(page)}

    ${page} {
      overflow-x: hidden !important;
      overflow-y: visible !important;
      background: var(--blog-white) !important;
      color: var(--blog-navy) !important;
    }

    ${root} .blog-blockpages-root > div,
    ${root} .blog-page > div {
      min-height: auto !important;
      max-height: none !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    /* Do not let the global flex-1 preview reset collapse blog sections. */
    ${root} .blog-page .flex-1,
    ${root} .blog-blockpages-root .flex-1 {
      flex: 1 1 auto !important;
    }

    /* Device nav fallbacks (mirror @[760px] when container queries are flaky). */
    ${root}[data-blockpages-preview-device="desktop"] .blog-page header nav[aria-label="Blog main navigation"],
    ${root}[data-blockpages-preview-device="tablet"] .blog-page header nav[aria-label="Blog main navigation"] {
      display: flex !important;
    }
    ${root}[data-blockpages-preview-device="desktop"] .blog-page header button[aria-controls="blog-mobile-nav"],
    ${root}[data-blockpages-preview-device="tablet"] .blog-page header button[aria-controls="blog-mobile-nav"] {
      display: none !important;
    }
    ${root}[data-blockpages-preview-device="mobile"] .blog-page header nav[aria-label="Blog main navigation"] {
      display: none !important;
    }
    ${root}[data-blockpages-preview-device="mobile"] .blog-page header button[aria-controls="blog-mobile-nav"] {
      display: inline-flex !important;
    }
    ${root}[data-blockpages-preview-device="mobile"] #blog-mobile-nav {
      width: 100% !important;
    }

    /* Section rhythm when utility classes lose var() resolution. */
    ${root} .blog-page section,
    ${root} .blog-blockpages-root section {
      max-width: 100% !important;
      min-width: 0 !important;
    }

    ${root}[data-blockpages-preview-device="mobile"] .blog-page,
    ${root}[data-blockpages-preview-device="mobile"] .blog-blockpages-root {
      --blog-safe-inline: clamp(0.65rem, 4cqw, 1.25rem);
      --blog-section-y: clamp(2rem, 6cqw, 3rem);
    }

    ${root}[data-blockpages-preview-device="tablet"] .blog-page,
    ${root}[data-blockpages-preview-device="tablet"] .blog-blockpages-root,
    ${root}[data-blockpages-preview-device="desktop"] .blog-page,
    ${root}[data-blockpages-preview-device="desktop"] .blog-blockpages-root {
      --stackly-nav-height: 3.75rem;
      --blog-nav-gap: 1.5rem;
    }
  `;
}

export function applyBlogThemeCustomProperties(element: HTMLElement) {
  const pairs: Array<[string, string]> = [
    ["--blog-navy", "#001f3f"],
    ["--blog-navy-muted", "#1a3a5c"],
    ["--blog-blue-bg", "#eaf2ff"],
    ["--blog-pink-bg", "#fff0f0"],
    ["--blog-accent", "#2d8cf0"],
    ["--blog-white", "#ffffff"],
    ["--blog-container", "72rem"],
    ["--blog-container-wide", "76rem"],
    ["--blog-section-y", "clamp(2.5rem, 7cqw, 5.5rem)"],
    ["--blog-section-y-lg", "clamp(3rem, 8cqw, 6.5rem)"],
    ["--blog-radius-sm", "0.75rem"],
    ["--blog-radius-md", "1rem"],
    ["--blog-radius-lg", "1.25rem"],
    ["--blog-safe-inline", "clamp(0.75rem, 4cqw, 3rem)"],
    ["--stackly-nav-height", "3.5rem"],
    ["--blog-header-height", "3.25rem"],
    ["--blog-nav-gap", "clamp(1rem, 2.5cqw, 1.5rem)"],
    ["--blog-header-content-gap", "0"],
    ["--blog-top-split", "38%"],
  ];
  for (const [name, value] of pairs) {
    element.style.setProperty(name, value);
  }
}
