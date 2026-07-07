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
import type { BuilderComponent, NavLink, NavigationProps } from "@/types/builder";
import NavigationComponent from "@/components/draggable/NavigationComponent";
import { NavigationPanel } from "./NavigationPanel";
import { escapeHtml } from "@/lib/htmlUtils";
import { Menu } from "lucide-react";

export const NAV_SCHEMA_VERSION = 1;

export const navigationDefaults: NavigationProps = {
  schemaVersion: NAV_SCHEMA_VERSION,
  brand: "Stackly Studio",
  logoUrl: "",
  logoAssetId: "",
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
  Pick<NavigationProps, "schemaVersion" | "brand" | "links" | "cta" | "variant" | "sticky" | "mobileMenu">
> & Pick<NavigationProps, "logoUrl" | "logoAssetId"> {
  const p = component.props;

  if (p && typeof p === "object") {
    return {
      schemaVersion: typeof p.schemaVersion === "number" ? p.schemaVersion : NAV_SCHEMA_VERSION,
      brand: asString(p.brand, navigationDefaults.brand),
      logoUrl: asString(p.logoUrl, ""),
      logoAssetId: asString(p.logoAssetId, ""),
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
    const logo = data.logoUrl
      ? `<img class="nav-logo" src="${escapeHtml(data.logoUrl)}" alt="${escapeHtml(data.brand)} logo" />`
      : "";
    return `<nav${styleAttr}>` +
      `<div class="nav-brand-group">${logo}<strong>${escapeHtml(data.brand)}</strong></div>` +
      `<div class="nav-links">${navLinks}</div>` +
      `<a href="${escapeHtml(ctaHref)}" role="button" class="nav-cta">${escapeHtml(data.cta.label)}</a>` +
      `<button class="nav-hamburger" onclick="_navToggle(this)" aria-label="Toggle menu" aria-expanded="false">` +
      `<span></span><span></span><span></span>` +
      `</button>` +
      `</nav>`;
  },
  ai: {
    description: "A top navigation bar with a brand name, nav links array, and a CTA button.",
    exampleOutput: navigationDefaults,
  },
};
