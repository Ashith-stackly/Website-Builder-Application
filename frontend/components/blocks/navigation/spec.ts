/**
 * Navigation — block spec.
 *
 * Single source of truth for the `navigation` block. Mirrors the
 * `hero` and `feature-item` patterns; copy this file as the template
 * for future block migrations.
 *
 * Inline editing: renderers call `onPatch({ props: ... })` (provided by
 * `CanvasItem`) — never write the legacy pipe-delimited `content` string.
 *
 * Legacy fallback: `readNavigation` handles the old
 *   "brand|Home,About,Services,Contact|CTA"
 * format transparently, so existing saved documents keep rendering.
 */

import type { BlockSpec } from "@/lib/blockRegistry";
import type { BuilderComponent, NavLink, NavigationLogoConfig, NavigationProps } from "@/types/builder";
import NavigationComponent from "@/components/draggable/NavigationComponent";
import { NavigationPanel } from "./NavigationPanel";
import { escapeHtml } from "@/lib/htmlUtils";
import { Menu } from "lucide-react";

export const NAV_SCHEMA_VERSION = 2;

const defaultLogo: NavigationLogoConfig = {
  type: "text",
  src: "",
  assetId: "",
  alt: "",
  width: 120,
  href: "/",
  openInNewTab: false,
};

export const navigationDefaults: NavigationProps = {
  schemaVersion: NAV_SCHEMA_VERSION,
  brand: "Stackly Studio",
  logoUrl: "",
  logoAssetId: "",
  logo: { ...defaultLogo },
  links: [
    { label: "Home",     href: "#" },
    { label: "About",    href: "#" },
    { label: "Services", href: "#" },
    { label: "Contact",  href: "#" },
  ],
  cta: { label: "Get Started" },
  variant: "default",
  sticky: false,
  mobileMenu: { enabled: false, breakpoint: "md" },
};

/* ─── narrow validators ─────────────────────────────────────────────── */

const isString = (v: unknown): v is string => typeof v === "string";
const asString = (v: unknown, fb: string): string => (isString(v) ? v : fb);

/**
 * Coerce one raw value into a `NavLink`.
 *
 * Accepted shapes (most → least preferred):
 *   • `{ label, href?, children? }` — typed object (current format)
 *   • `"Home"` or `"Home|#"` — bare string or pipe-split pair (AI / legacy)
 */
function readNavLink(v: unknown): NavLink {
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    const link: NavLink = { label: asString(obj.label, "Link") };
    if (isString(obj.href)) link.href = obj.href;
    if (Array.isArray(obj.children) && obj.children.length > 0) {
      link.children = obj.children.map(readNavLink);
    }
    return link;
  }

  // Tolerate bare strings: "Home" or "Home|#"
  if (isString(v)) {
    const [label, href] = v.split("|");
    const link: NavLink = { label: label.trim() || "Link" };
    if (href?.trim()) link.href = href.trim();
    return link;
  }

  return { label: "Link" };
}

function readLinks(v: unknown): NavLink[] {
  if (Array.isArray(v) && v.length > 0) return v.map(readNavLink);
  return navigationDefaults.links.map((l) => ({ ...l }));
}

function readCta(v: unknown): NavigationProps["cta"] {
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    return {
      label: asString(obj.label, navigationDefaults.cta.label),
      href: isString(obj.href) ? obj.href : undefined,
    };
  }
  if (isString(v)) return { label: v };
  return { ...navigationDefaults.cta };
}

const NAV_VARIANTS = ["default", "centered", "minimal"] as const;
const NAV_BREAKPOINTS = ["sm", "md", "lg"] as const;
const LOGO_TYPES = ["text", "image", "image-text"] as const;

function readMobileMenu(v: unknown): NavigationProps["mobileMenu"] {
  if (!v || typeof v !== "object") return { ...navigationDefaults.mobileMenu };
  const obj = v as Record<string, unknown>;
  return {
    enabled: typeof obj.enabled === "boolean" ? obj.enabled : navigationDefaults.mobileMenu?.enabled,
    breakpoint:
      isString(obj.breakpoint) && (NAV_BREAKPOINTS as readonly string[]).includes(obj.breakpoint)
        ? (obj.breakpoint as NavigationProps["mobileMenu"] & object extends { breakpoint?: infer B } ? B : never)
        : navigationDefaults.mobileMenu?.breakpoint,
  };
}

/**
 * Read the `logo` sub-object from component props, with automatic
 * migration from legacy `logoUrl` / `logoAssetId` flat fields.
 */
function readLogo(p: Record<string, unknown>): NavigationLogoConfig {
  // New structured `logo` object takes priority
  if (p.logo && typeof p.logo === "object") {
    const obj = p.logo as Record<string, unknown>;
    const logoType = isString(obj.type) && (LOGO_TYPES as readonly string[]).includes(obj.type)
      ? (obj.type as NavigationLogoConfig["type"])
      : defaultLogo.type;
    return {
      type: logoType,
      src: asString(obj.src, ""),
      assetId: asString(obj.assetId, ""),
      alt: asString(obj.alt, ""),
      width: typeof obj.width === "number" ? Math.min(Math.max(obj.width, 20), 400) : defaultLogo.width,
      href: asString(obj.href, defaultLogo.href!),
      openInNewTab: typeof obj.openInNewTab === "boolean" ? obj.openInNewTab : false,
    };
  }

  // Legacy migration: if `logoUrl` is set but no `logo` object, migrate
  const legacySrc = asString(p.logoUrl, "");
  if (legacySrc) {
    return {
      type: "image-text",
      src: legacySrc,
      assetId: asString(p.logoAssetId, ""),
      alt: "",
      width: defaultLogo.width,
      href: defaultLogo.href,
      openInNewTab: false,
    };
  }

  return { ...defaultLogo };
}

/* ─── reader ────────────────────────────────────────────────────────── */

/**
 * Returns fully-typed NavigationProps from a `BuilderComponent`.
 *
 * Resolution order:
 *   1. `component.props` (typed, current format)
 *   2. legacy pipe-delimited `content` ("brand|Home,About|CTA")
 *   3. spec defaults
 *
 * The reader is **total**: it always returns a valid `NavigationProps`,
 * never throws, never returns `undefined`.
 */
export function readNavigation(
  component: BuilderComponent,
): Required<
  Pick<NavigationProps, "schemaVersion" | "brand" | "links" | "cta" | "variant" | "sticky" | "mobileMenu" | "logo">
> & Pick<NavigationProps, "logoUrl" | "logoAssetId"> {
  const p = component.props;

  if (p && typeof p === "object") {
    const logo = readLogo(p);
    return {
      schemaVersion: typeof p.schemaVersion === "number" ? p.schemaVersion : NAV_SCHEMA_VERSION,
      brand: asString(p.brand, navigationDefaults.brand),
      logoUrl: asString(p.logoUrl, ""),
      logoAssetId: asString(p.logoAssetId, ""),
      logo,
      links: readLinks(p.links),
      cta: readCta(p.cta),
      variant:
        isString(p.variant) && (NAV_VARIANTS as readonly string[]).includes(p.variant)
          ? (p.variant as NonNullable<NavigationProps["variant"]>)
          : navigationDefaults.variant!,
      sticky: typeof p.sticky === "boolean" ? p.sticky : navigationDefaults.sticky!,
      mobileMenu: readMobileMenu(p.mobileMenu)!,
    };
  }

  // Legacy fallback: "brand|Home,About,Services,Contact|CTA"
  const [b, l, c] = (component.content || "").split("|");
  const legacyLinks: NavLink[] = (l || "Home,About,Services,Contact")
    .split(",")
    .map((item) => ({ label: item.trim() }))
    .filter((link) => link.label.length > 0);

  return {
    schemaVersion: NAV_SCHEMA_VERSION,
    brand: b?.trim() || navigationDefaults.brand,
    logoUrl: "",
    logoAssetId: "",
    logo: { ...defaultLogo },
    links: legacyLinks.length > 0 ? legacyLinks : navigationDefaults.links.map((link) => ({ ...link })),
    cta: { label: c?.trim() || navigationDefaults.cta.label },
    variant: navigationDefaults.variant!,
    sticky: navigationDefaults.sticky!,
    mobileMenu: { ...navigationDefaults.mobileMenu },
  };
}

/* ─── BlockSpec ──────────────────────────────────────────────────────── */

export const navigationSpec: BlockSpec<NavigationProps> = {
  type: "navigation",
  label: "Navigation",
  group: "navigation",
  icon: Menu,
  defaults: navigationDefaults,
  read: readNavigation,
  Renderer: NavigationComponent,
  Panel: NavigationPanel,
  exportHtml: (data, styleAttr) => {
    const navLinks = data.links
      .map((link) => `<a href="${escapeHtml(link.href ?? "#")}">${escapeHtml(link.label)}</a>`)
      .join("");
    const ctaHref = data.cta.href ?? "#";

    // Build logo + brand markup based on logo type
    const logo = data.logo ?? { ...defaultLogo };
    const logoHref = escapeHtml(logo.href || "/");
    const logoTarget = logo.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    const logoWidth = logo.width ?? 120;
    const logoAlt = escapeHtml(logo.alt || `${data.brand} logo`);

    let brandGroupInner = "";

    if (logo.type === "image" && logo.src) {
      brandGroupInner =
        `<a href="${logoHref}"${logoTarget} class="nav-logo-link">` +
        `<img class="nav-logo" src="${escapeHtml(logo.src)}" alt="${logoAlt}" style="width:${logoWidth}px;height:auto;object-fit:contain" />` +
        `</a>`;
    } else if (logo.type === "image-text" && logo.src) {
      brandGroupInner =
        `<a href="${logoHref}"${logoTarget} class="nav-logo-link">` +
        `<img class="nav-logo" src="${escapeHtml(logo.src)}" alt="${logoAlt}" style="width:${logoWidth}px;height:auto;object-fit:contain" />` +
        `</a>` +
        `<strong>${escapeHtml(data.brand)}</strong>`;
    } else {
      // "text" or fallback — legacy behavior with old logoUrl compat
      const legacyLogo = data.logoUrl
        ? `<img class="nav-logo" src="${escapeHtml(data.logoUrl)}" alt="${escapeHtml(data.brand)} logo" />`
        : "";
      brandGroupInner = `${legacyLogo}<strong>${escapeHtml(data.brand)}</strong>`;
    }

    return `<nav${styleAttr}>` +
      `<div class="nav-brand-group">${brandGroupInner}</div>` +
      `<div class="nav-links">` +
        `${navLinks}` +
        `<a href="${escapeHtml(ctaHref)}" role="button" class="nav-cta mobile-only">${escapeHtml(data.cta.label)}</a>` +
      `</div>` +
      `<a href="${escapeHtml(ctaHref)}" role="button" class="nav-cta desktop-only">${escapeHtml(data.cta.label)}</a>` +
      `<button class="nav-hamburger" onclick="_navToggle(this)" aria-label="Toggle menu" aria-expanded="false">` +
      `<span></span><span></span><span></span>` +
      `</button>` +
      `</nav>`;
  },
  ai: {
    description: "A top navigation bar with a brand name, optional logo image, nav links array, and a CTA button.",
    exampleOutput: navigationDefaults,
  },
};
