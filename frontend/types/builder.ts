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
  | "video"
  | "map"
  | "accordion"
  | "tabs"
  | "spacer"
  | "social-links"
  | "countdown"
  | "pricing-table"
  | "product-collection"
  | "testimonial"
  | "footer"
  | "form"
  | "row";

export interface ComponentStyles {
  color?: string;
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  width?: string;
  height?: string;
  textAlign?: CSSProperties["textAlign"];
  layoutCols?: string;
  /* ── Effects (added to replace the Advanced tab) ───────────────── */
  opacity?: string;
  boxShadow?: string;
  border?: string;
  overflow?: string;
  cursor?: string;
  transform?: string;
  transition?: string;
  /* ── Freeform positioning (Wix-style editor) ────────────────────── */
  position?: string;
  left?: string;
  top?: string;
  zIndex?: string;
  minWidth?: string;
  minHeight?: string;
  display?: string;
  gap?: string;
  flexWrap?: string;
  /* ── Layout (grid / flex / alignment — WYSIWYG parity) ──────────── */
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  columnGap?: string;
  rowGap?: string;
  maxWidth?: string;
  objectFit?: string;
  aspectRatio?: string;
  letterSpacing?: string;
  lineHeight?: string;
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
  /** Asset-library id for the selected logo, when chosen from imported assets. */
  logoAssetId?: string;
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

/* ─── New block props (Zoho-inspired) ───────────────────────────────── */

export interface MapProps {
  address: string;
  zoom: number;
  height: string;
}

export interface AccordionItem {
  title: string;
  content: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

export interface TabItem {
  label: string;
  content: string;
}

export interface TabsProps {
  items: TabItem[];
  variant?: "underline" | "pills" | "boxed";
}

export interface SpacerProps {
  height: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SocialLinksProps {
  links: SocialLink[];
  size: "sm" | "md" | "lg";
  style: "filled" | "outline" | "flat";
}

export interface CountdownProps {
  targetDate: string;
  label?: string;
  finishedText?: string;
}

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export interface PricingTableProps {
  heading?: string;
  tiers: PricingTier[];
}

/**
 * Editor-local catalog record for the Product Collection block.
 *
 * These records are intentionally presentation data, not database products:
 * they never fetch, mutate, or reserve inventory. A future commerce binding
 * can map a real product to the optional `id` without changing the renderer's
 * content schema.
 */
export interface ProductMock {
  id?: string;
  name: string;
  price: string;
  compareAtPrice?: string;
  description?: string;
  image: string;
  alt?: string;
  badge?: string;
  ctaLabel?: string;
}

/**
 * Configurable catalog section used inside the builder before a live commerce
 * catalog is connected. All values are safe mock/sample data stored with the
 * document JSON.
 */
export interface ProductCollectionProps {
  schemaVersion?: number;
  heading?: string;
  subheading?: string;
  products: ProductMock[];
  columns?: 2 | 3 | 4;
  variant?: "grid" | "featured" | "carousel" | "collection" | "category" | "best-sellers" | "latest" | "single";
  /** The display category/hint. It does not issue a catalog query in the editor. */
  category?: string;
  /** How a future published-site runtime may resolve a live catalog. */
  selection?: "manual" | "category" | "best-sellers" | "latest";
  /** Real product identifiers passed only to the published catalog runtime. */
  productIds?: string[];
  /** Upper bound a future runtime should render; the editor applies it to mock cards too. */
  limit?: number;
  sort?: "manual" | "newest" | "price-asc" | "price-desc" | "best-selling";
  /** Show sample category/filter controls. This never queries catalog data in the editor. */
  showFilters?: boolean;
  pagination?: boolean;
  showPrices?: boolean;
  showBadges?: boolean;
  ctaLabel?: string;
  emptyStateLabel?: string;
}

/** Fully normalized Product Collection props returned by the block reader. */
export type ProductCollectionData = Required<ProductCollectionProps>;

export interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  avatar?: string;
  rating?: number;
}

export interface TestimonialProps {
  heading?: string;
  items: TestimonialItem[];
  layout?: "cards" | "carousel" | "stack";
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterProps {
  brand: string;
  tagline?: string;
  columns: FooterColumn[];
  copyright?: string;
  socials?: SocialLink[];
}

export interface FormField {
  name: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface RowProps {
  layout: "50/50" | "33/33/33" | "25/50/25" | "25/75" | "75/25" | "33/67" | "67/33";
}

export interface FormProps {
  heading?: string;
  description?: string;
  fields: FormField[];
  submitLabel: string;
  successMessage?: string;
}

/* ─── Animation props (Phase 3) ──────────────────────────────────── */

export interface AnimationConfig {
  type: "none" | "fade-in" | "slide-up" | "slide-left" | "slide-right" | "zoom-in" | "bounce";
  duration?: number;
  delay?: number;
  easing?: string;
}

/* ─── SEO metadata ──────────────────────────────────────────────── */

export interface SEOMetadata {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

/**
 * Component types that act as full-width vertical-flow "sections".
 * These stay in the sortable vertical list; inner elements may be freeform.
 */
export const SECTION_TYPES: ReadonlySet<ComponentType> = new Set([
  "navigation", "hero", "features", "gallery", "contact", "container", "columns",
  "pricing-table", "product-collection", "testimonial", "footer", "accordion", "tabs", "form", "row",
]);

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
  textStyles?: Record<string, Partial<ComponentStyles>>;
  children: BuilderComponent[];
  order: number;
  /** Whether the element is locked from editing/moving. */
  locked?: boolean;
  /** Whether the element is hidden on the canvas (still exports). */
  hidden?: boolean;
  /**
   * Freeform canvas position (x, y in pixels from canvas top-left).
   * Only used when canvasMode === "freeform".
   */
  position?: { x: number; y: number };
  /** Z-index layer in freeform mode. */
  zIndex?: number;
  /** Explicit pixel size in freeform mode. */
  freeformSize?: { width: number; height: number };
  /** Per-viewport style overrides (tablet / mobile). Desktop is the base `styles`. */
  responsiveStyles?: ResponsiveStyles;
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
 * Only deltas from `styles` (base/desktop) need to be stored.
 * `tablet` applies at ≤768px, `mobile` at ≤480px.
 */
export type ResponsiveStyles = {
  tablet?: Partial<ComponentStyles>;
  mobile?: Partial<ComponentStyles>;
};

export interface BuilderRequirements {
  projectName: string;
  category: string;
  style: string;
  sections: string[];
}

/**
 * A deliberately small, validated client-side representation of a layout
 * returned by the AI layout endpoint.  The server may include richer hints,
 * but only known component types and the content fields below are applied to
 * the canvas.  Keeping this boundary explicit prevents an AI response from
 * injecting arbitrary builder state.
 */
export interface AILayoutSection {
  type: ComponentType;
  label?: string;
  purpose?: string;
  contentHint?: string;
  props?: Record<string, unknown>;
}

export interface AILayoutSuggestion {
  title?: string;
  rationale?: string;
  sections: AILayoutSection[];
  colorPalette?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
}

export interface BuilderState {
  components: BuilderComponent[];
  selectedComponentId: string | null;
  selectedTextStyleTarget: { componentId: string; key: string; label: string } | null;
  currentProjectId: string | null;
  currentProjectName: string | null;
  isDirty: boolean;
  lastSaved: string | null;
  isSaving: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string | null;
  addComponent: (type: ComponentType, parentId?: string | null, afterId?: string | null) => void;
  insertComponentBefore: (type: ComponentType, beforeId: string) => void;
  updateComponent: (id: string, updates: Partial<Omit<BuilderComponent, "id" | "children">> & { styles?: ComponentStyles }) => void;
  duplicateComponent: (id: string) => void;
  deleteComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  selectTextStyleTarget: (target: { componentId: string; key: string; label: string } | null) => void;
  isInlineEditing: boolean;
  setInlineEditing: (v: boolean) => void;
  reorderComponents: (activeId: string, overId: string) => void;
  loadStarterWebsite: () => void;
  loadWebsiteFromRequirements: (requirements: BuilderRequirements) => void;
  /** Replace the canvas with a reviewed AI layout in one undoable change. */
  applyAILayout: (suggestion: AILayoutSuggestion) => void;
  loadComponents: (components: BuilderComponent[]) => void;
  applyDesignTokens: (tokens: {
    colors: { primary: string; secondary: string; accent: string; background: string; text: string };
    typography: { fontFamily: string; baseFontSize: string; headingScale: number };
    buttons: { borderRadius: string; fontWeight: string };
    spacing: { base: number };
  }) => void;
  clearCanvas: () => void;
  exportHtml: () => string;
  /** Past component snapshots for undo. Capped at 50 entries. */
  history: BuilderComponent[][];
  /** Future component snapshots for redo. Cleared on any mutation. */
  future: BuilderComponent[][];
  undo: () => void;
  redo: () => void;
  /** Compatibility alias for backend autosave. */
  saveToLocalStorage: () => void;
  /** Local drafts are no longer loaded; projects are restored from the backend. */
  loadFromLocalStorage: () => boolean;
  loadProject: (id: string, signal?: AbortSignal) => Promise<boolean>;
  autosave: (signal?: AbortSignal) => Promise<boolean>;
  markDirty: () => void;
  saveHtml: (signal?: AbortSignal) => Promise<boolean>;
  /** Create a project on first save, then autosave builder data + HTML. */
  saveDraft: (signal?: AbortSignal) => Promise<boolean>;
  /** Reset builder state after logout. */
  resetBuilder: () => void;
  /** Active editing viewport. */
  viewport: Viewport;
  setViewport: (v: Viewport) => void;

  /** Canvas layout mode: flow (stacked) or freeform (absolute positioning). */
  canvasMode: "flow" | "freeform";
  toggleCanvasMode: () => void;
  /** Select a canvas mode; entering Freeform explicitly seeds only missing root positions. */
  setCanvasMode: (mode: "flow" | "freeform") => void;

  /* ── Wix-style freeform editing ─────────────────────────────────── */

  /** IDs of currently selected components (multi-select via Shift+Click). */
  selectedComponentIds: string[];
  /** Toggle a component in/out of the multi-selection. */
  toggleSelectComponent: (id: string) => void;
  /** Replace the current multi-selection (used by marquee/layers selection). */
  setSelectedComponentIds: (ids: string[]) => void;

  /** Clipboard for copy/paste. */
  clipboard: BuilderComponent[] | null;
  /** Copy selected components to clipboard. */
  copyComponents: () => void;
  /** Paste clipboard components onto the canvas. */
  pasteComponents: (parentId?: string | null) => void;
  /** Duplicate every selected component in one undoable operation. */
  duplicateSelectedComponents: () => void;
  /** Delete every selected component in one undoable operation. */
  deleteSelectedComponents: () => void;
  /** Wrap same-parent flow selections in a container. */
  groupSelectedComponents: () => void;
  /** Replace a grouping container with its children. */
  ungroupComponent: (id: string) => void;

  /** Move a component's layer order (z-index). */
  moveLayer: (id: string, direction: "front" | "back" | "forward" | "backward") => void;
  /** Freeform-move a component to (x, y) within its parent. */
  moveComponent: (id: string, x: number, y: number, options?: { snap?: boolean }) => void;
  /** Move multiple Freeform components in one render-safe, no-history update. */
  moveComponents: (positions: Array<{ id: string; x: number; y: number }>, options?: { snap?: boolean }) => void;
  /** Resize a component to width × height (px). */
  resizeComponent: (id: string, width: number, height: number, options?: { snap?: boolean }) => void;
  /** Capture one history snapshot before a pointer-driven freeform interaction. */
  beginFreeformInteraction: () => void;
  /** Move all selected freeform components by an exact pixel delta. */
  nudgeSelectedComponents: (x: number, y: number) => void;
  /** Apply a visual style patch to every unlocked selected component at once. */
  applyStylesToSelected: (styles: Partial<ComponentStyles>) => void;
  /** Toggle the locked state of a component. */
  toggleLock: (id: string) => void;

  /* ── Module 4: additional management actions ─────────────────────── */

  /** Move a component one position up among its siblings. */
  moveComponentUp: (id: string) => void;
  /** Move a component one position down among its siblings. */
  moveComponentDown: (id: string) => void;
  /** Toggle the hidden state of a component. */
  hideComponent: (id: string) => void;
  /** Export the full project state as a JSON string. */
  exportJSON: () => string;
  /** Import a JSON string, validate, and load. Returns error message or null. */
  importJSON: (json: string) => string | null;
}
