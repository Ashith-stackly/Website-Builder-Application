import type { CSSProperties } from "react";

export type ComponentType =
  | "navigation"
  | "hero"
  | "heading"
  | "text"
  | "button"
  | "icon"
  | "feature-item"
  | "columns"
  | "image"
  | "input"
  | "divider"
  | "features"
  | "gallery"
  | "contact"
  | "container"
  | "video";

export interface ComponentStyles {
  color?: string;
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  fontSize?: string;
  width?: string;
  height?: string;
  textAlign?: CSSProperties["textAlign"];
  layoutCols?: string;
}

/**
 * Typed props for the `feature-item` block.
 * Read via `readFeatureItem` in `@/components/blocks/feature-item/spec`.
 *
 * NOTE: This is the reference migration from pipe-delimited `content`
 * to typed `props`. Other component types still use `content` and
 * will be migrated incrementally.
 */
export interface FeatureItemProps {
  icon: string;
  layout: "horizontal" | "card";
  title: string;
  description: string;
  cta: string;
}

/**
 * A single navigation link.
 *
 * `children` is the extension point for dropdown / mega-menu items.
 * Renderers that don't support dropdowns yet simply ignore it —
 * no breaking change when the feature lands.
 */
export interface NavLink {
  label: string;
  href?: string;
  /** Future: dropdown children rendered as a sub-menu. */
  children?: NavLink[];
}

/**
 * Typed props for the `navigation` block.
 *
 * Design notes:
 * - `links` is `NavLink[]` (object array), not a comma-string, so each
 *   item can gain `href`, `icon`, `badge`, `children` without migration.
 * - `cta` mirrors HeroProps.cta — same shape, consistent AI schema.
 * - `logoUrl` reserves the slot for image logos without touching the
 *   current text-brand path.
 * - `variant` / `sticky` are layout extension points the renderer ignores
 *   today but AI generation and future style variants can populate freely.
 * - `mobileMenu` groups all responsive concerns in one sub-object so they
 *   stay co-located and can be toggled via a single feature flag.
 * - `schemaVersion` enables forward migrations without full re-writes.
 */
export interface NavigationProps {
  schemaVersion?: number;
  brand: string;
  /** Future: URL for a logo image; falls back to `brand` text when absent. */
  logoUrl?: string;
  links: NavLink[];
  cta: {
    label: string;
    href?: string;
    /** Future: visual style of the CTA button. */
    variant?: "primary" | "outline" | "ghost";
  };
  /** Future: overall nav layout variant. */
  variant?: "default" | "centered" | "minimal";
  /** Future: stick the nav to the top on scroll. */
  sticky?: boolean;
  /**
   * Future: responsive mobile menu config.
   * Rendered as a hamburger / drawer below the given breakpoint.
   */
  mobileMenu?: {
    enabled?: boolean;
    breakpoint?: "sm" | "md" | "lg";
  };
}

/**
 * Typed props for the `hero` block.
 *
 * Design notes:
 * - All non-essential fields are OPTIONAL so older documents without them
 *   keep validating and the reader can supply safe defaults.
 * - `cta` is an OBJECT (not just a string) so we can add `href`, `variant`,
 *   `icon`, etc. later without another schema migration.
 * - `media`, `layout`, `align` are reserved extension points the renderer
 *   may not consume yet — they exist so AI generation and future visual
 *   variants don't require breaking changes.
 * - `schemaVersion` lets us run migration code if the shape ever changes.
 */
export interface HeroProps {
  schemaVersion?: number;
  title: string;
  description: string;
  cta: {
    label: string;
    href?: string;
  };
  layout?: "split" | "centered" | "stacked";
  align?: "left" | "center";
  media?: {
    type: "image" | "placeholder";
    src?: string;
    alt?: string;
  };
}

/**
 * Typed props for the `contact` block.
 *
 * Design notes:
 * - `inputPlaceholder` is a first-class field so AI can set it without
 *   knowing the pipe-split index.
 * - `cta` mirrors HeroProps.cta for a consistent cross-block shape.
 * - `form` is an optional sub-object reserving all future submission,
 *   validation, and multi-field concerns in one place. The current renderer
 *   ignores it — adding fields later is a non-breaking addition.
 */
export interface ContactProps {
  schemaVersion?: number;
  title: string;
  description: string;
  inputPlaceholder: string;
  cta: {
    label: string;
    href?: string;
  };
  /**
   * Future: controls form submission behaviour and extra fields.
   * Renderer ignores this object until the feature is implemented.
   */
  form?: {
    action?: string;
    method?: "POST" | "GET";
    successMessage?: string;
    /** Future: additional form fields beyond the single email input. */
    fields?: Array<{
      name: string;
      type: "text" | "email" | "tel" | "textarea";
      label?: string;
      placeholder?: string;
      required?: boolean;
    }>;
  };
}

/**
 * A single item in a `features` block.
 *
 * `icon` and `badge` are optional extension points the renderer ignores
 * today; AI generation and future variants can populate them freely.
 */
export interface FeatureRecord {
  title: string;
  description: string;
  /** Future: Lucide icon name shown alongside the feature. */
  icon?: string;
  /** Future: pill label e.g. "New", "Popular". */
  badge?: string;
}

/**
 * Typed props for the `features` block.
 *
 * Design notes:
 * - `items` is `FeatureRecord[]` (object array), replacing the newline+pipe
 *   string format. Each item can gain `icon`, `badge`, `link` without
 *   another schema migration.
 * - `heading` is optional — lets AI or editors add a section title without
 *   requiring a separate `heading` block above the features grid.
 * - `layout` / `columns` are reserved for future grid variants and are
 *   ignored by the current renderer.
 */
export interface FeaturesProps {
  schemaVersion?: number;
  /** Optional section heading rendered above the feature cards. */
  heading?: string;
  items: FeatureRecord[];
  /** Future: visual layout variant for the features grid. */
  layout?: "grid" | "list" | "masonry";
  /** Future: explicit column count override (default 3). */
  columns?: 2 | 3 | 4;
}

/**
 * Typed props for the `video` block.
 *
 * Supports YouTube and Vimeo URLs. The renderer parses the URL into
 * the appropriate embed URL at render time — callers store the original.
 */
export interface VideoProps {
  url: string;
  title?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
}

export interface BuilderComponent {
  id: string;
  type: ComponentType;
  content: string;
  /**
   * Typed structured props per component spec.
   * Optional during the gradual migration away from pipe-delimited `content`.
   * Always read via the component's `read*` helper, never directly.
   */
  props?: Record<string, unknown>;
  styles: ComponentStyles;
  children: BuilderComponent[];
  order: number;
}

/* ─── Viewport / responsive editing ────────────────────────────────── */

export type Viewport = "desktop" | "tablet" | "mobile";

export const VIEWPORT_WIDTHS: Record<Viewport, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

/**
 * Per-breakpoint style overrides.
 * Only deltas from `styles` (base) need to be stored.
 * sm=640px  md=768px  lg=1024px
 */
export type ResponsiveStyles = {
  sm?: Partial<ComponentStyles>;
  md?: Partial<ComponentStyles>;
  lg?: Partial<ComponentStyles>;
};

export interface BuilderRequirements {
  projectName: string;
  category: string;
  style: string;
  sections: string[];
}

export interface BuilderState {
  components: BuilderComponent[];
  selectedComponentId: string | null;
  addComponent: (type: ComponentType, parentId?: string | null, afterId?: string | null) => void;
  updateComponent: (id: string, updates: Partial<Omit<BuilderComponent, "id" | "children">> & { styles?: ComponentStyles }) => void;
  duplicateComponent: (id: string) => void;
  deleteComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  isInlineEditing: boolean;
  setInlineEditing: (v: boolean) => void;
  reorderComponents: (activeId: string, overId: string) => void;
  loadStarterWebsite: () => void;
  loadWebsiteFromRequirements: (requirements: BuilderRequirements) => void;
  clearCanvas: () => void;
  exportHtml: () => string;
  /** Past component snapshots for undo. Capped at 50 entries. */
  history: BuilderComponent[][];
  /** Future component snapshots for redo. Cleared on any mutation. */
  future: BuilderComponent[][];
  undo: () => void;
  redo: () => void;
  /** Serialise current canvas to localStorage. */
  saveToLocalStorage: () => void;
  /** Restore canvas from localStorage. Returns false if no draft exists. */
  loadFromLocalStorage: () => boolean;
  /** Active editing viewport. */
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
}
