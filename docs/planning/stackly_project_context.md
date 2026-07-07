# Stackly — Website Builder Application: Complete Project Context

> **Purpose**: This document is a single-source-of-truth context payload. Feed it (or relevant sections) to any AI model to get accurate, project-aware responses for frontend, backend, cloud, or planning prompts.

> **Last Updated**: 2026-06-16 | **Tech Stack**: Next.js 16 (Frontend) · Node.js + Express + MongoDB (Backend) · AWS + Jenkins (DevOps)

---

## 1. Product Overview

**Stackly** is a no-code, drag-and-drop website builder (think simplified Wix/Squarespace) that lets users:

1. Sign up / log in (email, mobile, Google OAuth)
2. Choose a project type (E-commerce, Portfolio, Blog, Business, Restaurant)
3. Pick a template style (Modern, Minimal, Bold) and sections
4. Build pages visually with a drag-and-drop canvas (flow + freeform modes)
5. Use 25+ component types including pricing tables, testimonials, accordions, forms, maps, countdowns, social links, and footers
6. Apply global design tokens (colors, typography, buttons, spacing) across the entire site
7. Insert pre-designed section templates (Hero, Features, Pricing, Testimonials, FAQ, CTA, Footer, Contact)
8. Preview in Desktop / Tablet / Mobile viewports with zoom controls
9. Manage projects from a dashboard with analytics, search, sort, and project settings
10. Export to static HTML or publish to a hosted subdomain
11. (Future) Add e-commerce, blog CMS, advanced analytics, AI content generation

**Brand**: "Stackly" — tagline: "Drag and Drop Website Builder"  
**Domain**: thestackly.com (planned), currently deployed via GitHub Pages  
**Logo**: `/public/stackly-logo.webp`, favicon: `/public/stackly-title-icon.webp`

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 | `output: "export"` (static site generation) |
| Language | TypeScript | ^5 | Strict mode |
| UI Library | React | 19.2.3 | Server + Client components |
| Styling | Tailwind CSS v4 + globals.css (87KB) | ^4 | PostCSS pipeline |
| State | Zustand | ^5.0.13 | Four stores: `builderStore`, `assetStore`, `projectStore`, `designStore` |
| Drag & Drop | @dnd-kit/core + sortable | ^6.3.1 / ^10.0.0 | Pointer sensor, vertical list strategy + freeform mode |
| Animation | Framer Motion | ^12.40.0 | Page transitions, component animations |
| Charts | Recharts | ^3.8.1 | Analytics dashboard charts (views, visitors) |
| Icons | Lucide React + React Icons | ^1.14.0 / ^5.5.0 | Lucide for builder, React Icons for marketing pages |
| Auth (planned) | next-auth | ^4.24.13 | Installed but NOT wired up yet |
| Payment | Razorpay (client SDK) | via CDN script | Standalone API server on port 3001 |
| IDs | uuid | ^14.0.0 | v4 for component + asset IDs |
| PDF | html2pdf.js | ^0.14.0 | Invoice generation in planning page |
| Deploy | GitHub Pages (gh-pages) | ^6.3.0 | `next build && gh-pages -d out` |
| Image Processing | sharp (dev) | ^0.34.5 | WebP conversion scripts |

### Build Configuration

```js
// next.config.mjs — key settings
{
  output: "export",           // Static HTML export (NO server-side)
  trailingSlash: true,        // /login/ not /login
  basePath: "",               // Configurable for GitHub Pages subpath
  images: { unoptimized: true }, // No Next.js image optimization (static)
}
```

### NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `node scripts/dev-with-razorpay.mjs` | Runs Next.js dev + Razorpay API server |
| `dev:next` | `node scripts/dev-safe.mjs` | Next.js dev only (no payment server) |
| `razorpay-api` | `node scripts/razorpay-api-server.mjs` | Standalone payment API on :3001 |
| `build` | `next build` | Production build (static export to `/out`) |
| `deploy` | `next build && gh-pages -d out` | Build + deploy to GitHub Pages |

---

## 3. Directory Structure

```
d:\stackly\Workplace\Website-Builder-Application\
│
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (Lora + Geist Mono fonts, NavBar, loading overlay)
│   ├── page.tsx                  # Root redirect/home
│   ├── globals.css               # 87KB master stylesheet
│   ├── login.css                 # Auth pages styling
│   │
│   ├── login/page.tsx            # 27KB — Login page (email/mobile + password)
│   ├── signup/page.tsx           # 36KB — Registration (name, email, mobile, password)
│   ├── forgot-password/page.tsx  # Password recovery initiation
│   ├── verify-email/page.tsx     # 4-digit OTP verification (email)
│   ├── verify-mobile/page.tsx    # 4-digit OTP verification (mobile)
│   ├── create-new-password/page.tsx # Password reset form (post-OTP)
│   ├── verified/                 # Success confirmation page
│   │
│   ├── landing/page.tsx          # 62KB — Marketing landing page
│   ├── aboutus/page.tsx          # 17KB — About us page
│   ├── contact/page.tsx          # 12KB — Contact page
│   │
│   ├── dashboard/                # ⭐ NEW — User dashboard hub
│   │   ├── page.tsx              # 10KB — Project listing, stats, create project
│   │   ├── layout.tsx            # Dashboard layout wrapper
│   │   ├── analytics/page.tsx    # 6KB — Analytics dashboard with charts
│   │   └── settings/page.tsx     # 4KB — Project settings page
│   │
│   ├── builder/page.tsx          # Builder entry (loads BuilderLayout)
│   ├── blockpages/               # Block showcase/demo pages
│   │   ├── BlockPagesClient.tsx
│   │   ├── buttonblock/
│   │   ├── imageblock/
│   │   ├── textblock/
│   │   └── preview/
│   │
│   ├── planning/page.tsx         # 46KB — Pricing plans + invoice generation
│   ├── portfolio/page.tsx        # 64KB — Portfolio template showcase
│   ├── restaurant/page.tsx       # ⭐ NEW — 22KB — Restaurant template showcase
│   ├── blog/                     # Blog section
│   │   ├── page.tsx              # 29KB — Blog listing
│   │   ├── blog.css              # 39KB — Blog styles
│   │   └── layout.tsx
│   ├── e-commerce/page.tsx       # 96KB — E-commerce showcase/demo
│   ├── video-block/page.tsx      # ⭐ NEW — 4KB — Video block demo page
│   │
│   ├── backend-error/            # Backend connection error page
│   └── page-not-found/           # Custom 404
│
├── components/
│   ├── navBar.tsx                # 43KB — Global navigation bar
│   ├── Footer.tsx                # 17KB — Global footer
│   ├── CreateProjectFlow.tsx     # 13KB — 4-step project creation wizard
│   ├── NavBarShell.tsx           # Client wrapper for NavBar
│   ├── AuthGoogleButton.tsx      # Google OAuth button
│   ├── RouteLoadingOverlay.tsx   # Route transition overlay
│   ├── StacklyLoader.tsx         # Loading spinner
│   ├── ResetFlowBackButton.tsx   # Back button for reset flow
│   │
│   ├── dashboard/                # ⭐ NEW — Dashboard UI components
│   │   ├── DashboardHeader.tsx   # 7KB — Dashboard header with search + filters
│   │   ├── ProjectGrid.tsx       # 4KB — Project cards grid layout
│   │   ├── ProjectCard.tsx       # 11KB — Individual project card (edit, delete, duplicate)
│   │   ├── CreateProjectModal.tsx # 17KB — Modal for creating new projects
│   │   ├── ProjectSettingsForm.tsx # 10KB — Project settings form
│   │   ├── StatsCards.tsx        # 4KB — Dashboard statistics cards
│   │   └── EmptyProjects.tsx     # 4KB — Empty state when no projects
│   │
│   ├── analytics/                # ⭐ NEW — Analytics dashboard components
│   │   ├── AnalyticsCards.tsx     # 3KB — KPI summary cards
│   │   ├── ViewsChart.tsx        # 4KB — Page views line chart (Recharts)
│   │   ├── VisitorsChart.tsx     # 3KB — Visitors line chart (Recharts)
│   │   ├── TopPages.tsx          # 2KB — Top pages table
│   │   └── ActivityTable.tsx     # 4KB — Recent activity log
│   │
│   ├── builder/                  # Builder UI components
│   │   ├── BuilderLayout.tsx     # 14KB — Main builder layout (DnD context)
│   │   ├── Canvas.tsx            # 21KB — Drop zone + toolbar
│   │   ├── CanvasItem.tsx        # 10KB — Individual item wrapper
│   │   ├── ComponentPalette.tsx  # 11KB — Left sidebar block picker
│   │   ├── PropertyEditor.tsx    # 18KB — Right sidebar property panel
│   │   ├── PreviewModal.tsx      # 6KB — Full-screen preview with device toggle
│   │   ├── SortableItem.tsx      # 3KB — Sortable wrapper for DnD
│   │   ├── InlineText.tsx        # 4KB — Inline text editing
│   │   ├── LayersPanel.tsx       # 4KB — Layer/component tree view
│   │   ├── ExportButton.tsx      # 4KB — HTML export button
│   │   ├── PanelFields.tsx       # 2KB — Shared panel field components
│   │   ├── ContextMenu.tsx       # ⭐ NEW — 8KB — Right-click context menu
│   │   ├── FreeformCanvas.tsx    # ⭐ NEW — 5KB — Freeform (Wix-style) canvas
│   │   ├── FreeformItem.tsx      # ⭐ NEW — 12KB — Freeform draggable item
│   │   ├── FreeformWrapper.tsx   # ⭐ NEW — 5KB — Wrapper for freeform items
│   │   ├── ResizeHandles.tsx     # ⭐ NEW — 5KB — Resize handles for freeform
│   │   ├── SnapGuides.tsx        # ⭐ NEW — 5KB — Smart snap alignment guides
│   │   ├── GlobalStylesPanel.tsx # ⭐ NEW — 8KB — Design tokens editor panel
│   │   ├── SEOPanel.tsx          # ⭐ NEW — 5KB — SEO metadata editor
│   │   ├── SectionTemplates.tsx  # ⭐ NEW — 7KB — Section templates browser
│   │   ├── QuickInsertBar.tsx    # ⭐ NEW — 5KB — Quick component insert bar
│   │   ├── ZoomControls.tsx      # ⭐ NEW — 2KB — Canvas zoom in/out controls
│   │   └── panel/
│   │       ├── StyleTab.tsx      # 10KB — Style editing tab
│   │       ├── EffectsTab.tsx    # ⭐ NEW — 18KB — Advanced effects tab (opacity, shadow, border, transform)
│   │       └── controls/         # Style control components
│   │
│   ├── draggable/                # ⭐ EXPANDED — 27 canvas-rendered component types (was 17)
│   │   ├── HeadingComponent.tsx
│   │   ├── TextComponent.tsx
│   │   ├── ButtonComponent.tsx
│   │   ├── ImageComponent.tsx
│   │   ├── VideoComponent.tsx
│   │   ├── IconComponent.tsx
│   │   ├── InputComponent.tsx
│   │   ├── DividerComponent.tsx
│   │   ├── ColumnsComponent.tsx
│   │   ├── ContainerComponent.tsx
│   │   ├── GalleryComponent.tsx
│   │   ├── HeroComponent.tsx
│   │   ├── NavigationComponent.tsx
│   │   ├── FeaturesComponent.tsx
│   │   ├── FeatureItemComponent.tsx
│   │   ├── ContactComponent.tsx
│   │   ├── AccordionComponent.tsx    # ⭐ NEW — Expandable FAQ/content
│   │   ├── TabsComponent.tsx         # ⭐ NEW — Tabbed content panels
│   │   ├── SpacerComponent.tsx       # ⭐ NEW — Adjustable vertical spacing
│   │   ├── MapComponent.tsx          # ⭐ NEW — Google Maps embed
│   │   ├── SocialLinksComponent.tsx  # ⭐ NEW — Social media icon links
│   │   ├── CountdownComponent.tsx    # ⭐ NEW — Countdown timer
│   │   ├── PricingTableComponent.tsx # ⭐ NEW — Multi-tier pricing table
│   │   ├── TestimonialComponent.tsx  # ⭐ NEW — Customer testimonial cards
│   │   ├── FooterComponent.tsx       # ⭐ NEW — Full-width footer with columns
│   │   ├── FormComponent.tsx         # ⭐ NEW — Multi-field contact/signup form
│   │   └── componentStyles.ts
│   │
│   ├── blocks/                   # Migrated block specs (new architecture)
│   │   ├── hero/          → spec.ts + HeroPanel.tsx
│   │   ├── navigation/    → spec.ts + NavigationPanel.tsx
│   │   ├── feature-item/  → spec.ts + (panel in draggable)
│   │   ├── features/      → spec.ts + (panel in draggable)
│   │   ├── contact/       → spec.ts + (panel in draggable)
│   │   ├── video/         → spec.ts + (panel in draggable)
│   │   └── image/         → ImagePanel.tsx
│   │
│   ├── blog/
│   │   ├── BlogHeader.tsx        # 14KB — Blog header component
│   │   └── BlogHeroTrendArrow.tsx
│   │
│   └── assets/                   # Asset management UI
│       ├── AssetManager.tsx      # 12KB — Asset library modal
│       ├── AssetCard.tsx         # Individual asset card
│       ├── DropZone.tsx          # File drop zone
│       └── ImagePicker.tsx       # 10KB — Image selection picker
│
├── store/
│   ├── builderStore.ts           # 29KB — Builder state (Zustand) — flow + freeform modes
│   ├── assetStore.ts             # 6KB — Asset management state (Zustand)
│   ├── projectStore.ts           # ⭐ NEW — 5KB — Project CRUD state (Zustand + localStorage)
│   └── designStore.ts            # ⭐ NEW — 4KB — Design tokens + SEO + zoom state (Zustand)
│
├── types/
│   ├── builder.ts                # 16KB — All builder TypeScript interfaces (25+ component types)
│   ├── assets.ts                 # 1KB — Asset type definitions
│   ├── project.ts                # ⭐ NEW — 1KB — Project type definitions
│   └── analytics.ts              # ⭐ NEW — 1KB — Analytics type definitions
│
├── hooks/
│   └── useBuilder.ts             # Builder store hook wrapper
│
├── lib/
│   ├── api.ts                    # 4KB — Backend API client (auth endpoints)
│   ├── analytics.ts              # ⭐ NEW — 9KB — Analytics tracking + aggregation (localStorage)
│   ├── sectionTemplates.ts       # ⭐ NEW — 15KB — 12 pre-designed section templates
│   ├── portfolioProjectsSlider.ts # ⭐ NEW — 4KB — Portfolio page slider logic
│   ├── blockRegistry.ts          # 8KB — Block spec registry system
│   ├── componentRegistry.ts      # 4KB — Component renderer registry
│   ├── exportHtml.ts             # 18KB — JSON→HTML export engine
│   ├── googleAuth.ts             # 1KB — Google OAuth URL builder
│   ├── razorpayClient.ts         # 6KB — Razorpay checkout integration
│   ├── assetDb.ts                # 3KB — IndexedDB wrapper for assets
│   ├── assetUtils.ts             # 3KB — Image compression/thumbnail utils
│   ├── emailValidation.ts        # 7KB — Email validation rules
│   ├── paths.ts                  # 1KB — Base path + route helpers
│   ├── htmlUtils.ts              # HTML escape utility
│   ├── motion.ts                 # Framer Motion presets
│   ├── otpInputHandlers.ts       # OTP input field handlers
│   ├── planningInvoiceHtml.ts    # 26KB — Invoice HTML template
│   ├── signupPhoneCountries.ts   # 10KB — Country code data
│   ├── simpleMobileContact.ts    # Mobile contact form helpers
│   ├── authMobileTouch.ts        # Mobile auth touch handlers
│   ├── authPlaceholderFit.ts     # Auth placeholder fitting
│   ├── resetFlowValidation.ts    # Password reset validation
│   ├── blogCategories.ts         # Blog category data
│   └── html2pdf.d.ts             # Type declaration for html2pdf
│
├── scripts/
│   ├── dev-safe.mjs              # Safe dev server launcher
│   ├── dev-with-razorpay.mjs     # Dev + Razorpay API launcher
│   ├── razorpay-api-server.mjs   # Standalone Razorpay API (port 3001)
│   ├── convert-png-to-webp.cjs   # Image conversion script
│   └── compress-webp-to-100kb.cjs # Image compression script
│
├── test/controllers/
│   └── authController.js         # 17KB — Backend auth controller (Node.js/Express reference)
│
└── public/                       # 109+ static assets (images, icons, SVGs)
    ├── stackly-logo.webp
    ├── stackly-title-icon.webp
    ├── landing-optimized/        # Optimized landing page images
    ├── blog/                     # Blog images
    └── market/                   # Marketplace images
```

---

## 4. Core Architecture Patterns

### 4.1 Block Spec System (Key Pattern)

The builder uses a **registry-based architecture** where each component type is defined by a `BlockSpec<P>`:

```typescript
interface BlockSpec<P> {
  type: ComponentType;          // "hero" | "navigation" | ...
  label: string;                // Display name
  group: "layout" | "content" | "media" | "form" | "navigation";
  icon: React.ComponentType;    // Lucide icon
  defaults: P;                  // Default props
  read: (component: BuilderComponent) => P;  // Reader (handles legacy + typed)
  Renderer: React.ComponentType<RendererProps>;  // Canvas renderer
  Panel: React.ComponentType<PanelProps<P>>;     // Property editor panel
  exportHtml: (data: P, styleAttr: string) => string;  // HTML export
  accepts?: ComponentType[] | "any" | "none";    // Container slots
  ai?: { description: string; exampleOutput: P }; // AI generation hints
}
```

**Currently migrated to BlockSpec**: `hero`, `navigation`, `feature-item`, `contact`, `features`, `video`  
**New blocks (typed props, not yet full BlockSpec)**: `map`, `accordion`, `tabs`, `spacer`, `social-links`, `countdown`, `pricing-table`, `testimonial`, `footer`, `form`  
**Still using legacy `content` string**: `heading`, `text`, `button`, `image`, `icon`, `columns`, `input`, `divider`, `gallery`, `container`

### 4.2 State Management (Zustand — 4 Stores)

**Builder Store** (`store/builderStore.ts` — 29KB):
- `components: BuilderComponent[]` — flat tree of page components
- `selectedComponentId` / `selectedComponentIds` — single/multi selection
- `selectedTextStyleTarget` — sub-element style editing (e.g., CTA button inside hero)
- `history/future` — undo/redo stacks (max 50)
- `viewport` — current editing viewport (desktop/tablet/mobile)
- `canvasMode` — `"flow"` (stacked) or `"freeform"` (absolute positioning)
- `clipboard` — copy/paste buffer for components
- Actions: `addComponent`, `insertComponentBefore`, `updateComponent`, `deleteComponent`, `duplicateComponent`, `reorderComponents`, `loadStarterWebsite`, `loadWebsiteFromRequirements`, `loadComponents`, `applyDesignTokens`, `clearCanvas`, `exportHtml`, `undo`, `redo`, `saveToLocalStorage`, `loadFromLocalStorage`, `toggleCanvasMode`, `toggleSelectComponent`, `copyComponents`, `pasteComponents`, `moveLayer`, `moveComponent`, `resizeComponent`, `toggleLock`

**Asset Store** (`store/assetStore.ts` — 6KB):
- `assets: Asset[]` — metadata loaded from IndexedDB
- `objectUrls: Record<string, string>` — cached blob URLs
- Actions: `loadAssets`, `uploadFiles`, `deleteAsset`, `getUrl`, `getDataUrl`, `cleanup`

**Project Store** (`store/projectStore.ts` — 5KB) ⭐ NEW:
- `projects: Project[]` — all user projects (from localStorage)
- `searchQuery` — search filter
- `sort: ProjectSort` — sorting by name/createdAt/updatedAt
- Actions: `loadProjects`, `createProject`, `updateProject`, `deleteProject`, `duplicateProject`, `renameProject`, `setSearchQuery`, `setSort`
- Derived: `getFilteredProjects()`, `getProjectById(id)`

**Design Store** (`store/designStore.ts` — 4KB) ⭐ NEW:
- `tokens: DesignTokens` — global design tokens (colors, typography, buttons, spacing)
- `seo: SEOMetadata` — site-level SEO (title, description, OG tags)
- `zoom: number` — canvas zoom level (25%–200%)
- `autoSaveEnabled` / `lastSavedAt` — auto-save state
- `showGlobalStyles` / `showSEOPanel` — panel visibility toggles
- Actions: `setTokens`, `setColorToken`, `resetTokens`, `setSEO`, `setZoom`, `toggleAutoSave`, `toggleGlobalStyles`, `toggleSEOPanel`

### 4.3 Component Data Model

```typescript
// 25 component types (was 16)
type ComponentType =
  | "navigation" | "hero" | "heading" | "text" | "button"
  | "icon" | "feature-item" | "columns" | "image" | "input"
  | "divider" | "features" | "gallery" | "contact"
  | "container" | "video"
  // ⭐ NEW types
  | "map" | "accordion" | "tabs" | "spacer" | "social-links"
  | "countdown" | "pricing-table" | "testimonial" | "footer" | "form";

interface BuilderComponent {
  id: string;                    // UUID v4
  type: ComponentType;           // 25 types
  content: string;               // Legacy: pipe-delimited or plain text
  props?: Record<string, unknown>; // New: typed structured props
  styles: ComponentStyles;       // Inline styles (expanded)
  textStyles?: Record<string, Partial<ComponentStyles>>; // ⭐ NEW: sub-element styles
  children: BuilderComponent[];  // Nested components (containers)
  order: number;                 // Sort order
  locked?: boolean;              // ⭐ NEW: prevent editing/moving
  position?: { x: number; y: number }; // ⭐ NEW: freeform canvas position
  zIndex?: number;               // ⭐ NEW: layer ordering
  freeformSize?: { width: number; height: number }; // ⭐ NEW: explicit size
}

interface ComponentStyles {
  color?: string;
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  fontSize?: string;
  fontFamily?: string;           // ⭐ NEW
  fontWeight?: string;           // ⭐ NEW
  width?: string;
  height?: string;
  textAlign?: CSSProperties["textAlign"];
  layoutCols?: string;
  // ⭐ NEW — Effects
  opacity?: string;
  boxShadow?: string;
  border?: string;
  overflow?: string;
  cursor?: string;
  transform?: string;
  transition?: string;
  // ⭐ NEW — Freeform positioning
  position?: string;
  left?: string;
  top?: string;
  zIndex?: string;
  minWidth?: string;
  minHeight?: string;
}
```

### 4.4 Typed Props Interfaces (All Block Types)

```typescript
// NavigationProps — fully typed, BlockSpec migrated
interface NavigationProps {
  schemaVersion?: number;
  brand: string;
  logoUrl?: string;
  logoAssetId?: string;
  links: NavLink[];
  cta: { label: string; href?: string; variant?: "primary"|"outline"|"ghost" };
  variant?: "default" | "centered" | "minimal";
  sticky?: boolean;
  mobileMenu?: { enabled?: boolean; breakpoint?: "sm"|"md"|"lg" };
}

// HeroProps — fully typed, BlockSpec migrated
interface HeroProps {
  schemaVersion?: number;
  title: string;
  description: string;
  cta: { label: string; href?: string };
  layout?: "split" | "centered" | "stacked";
  align?: "left" | "center";
  media?: { type: "image"|"placeholder"; src?: string; alt?: string };
}

// ContactProps — fully typed, BlockSpec migrated
interface ContactProps {
  schemaVersion?: number;
  title: string;
  description: string;
  inputPlaceholder: string;
  cta: { label: string; href?: string };
  form?: { action?: string; method?: "POST"|"GET"; successMessage?: string; fields?: FormField[] };
}

// FeaturesProps — fully typed, BlockSpec migrated
interface FeaturesProps {
  schemaVersion?: number;
  heading?: string;
  items: FeatureRecord[];
  layout?: "grid" | "list" | "masonry";
  columns?: 2 | 3 | 4;
}

// VideoProps — fully typed, BlockSpec migrated
interface VideoProps {
  url: string;
  title?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
}

// FeatureItemProps — fully typed, BlockSpec migrated
interface FeatureItemProps {
  icon: string;
  layout: "horizontal" | "card";
  title: string;
  description: string;
  cta: string;
}

// ⭐ NEW block props
interface MapProps { address: string; zoom: number; height: string; }
interface AccordionProps { items: AccordionItem[]; allowMultiple?: boolean; }
interface TabsProps { items: TabItem[]; variant?: "underline" | "pills" | "boxed"; }
interface SpacerProps { height: string; }
interface SocialLinksProps { links: SocialLink[]; size: "sm"|"md"|"lg"; style: "filled"|"outline"|"flat"; }
interface CountdownProps { targetDate: string; label?: string; finishedText?: string; }
interface PricingTableProps { heading?: string; tiers: PricingTier[]; }
interface TestimonialProps { heading?: string; items: TestimonialItem[]; layout?: "cards"|"carousel"|"stack"; }
interface FooterProps { brand: string; tagline?: string; columns: FooterColumn[]; copyright?: string; socials?: SocialLink[]; }
interface FormProps { heading?: string; description?: string; fields: FormField[]; submitLabel: string; successMessage?: string; }
interface AnimationConfig { type: "none"|"fade-in"|"slide-up"|"slide-left"|"slide-right"|"zoom-in"|"bounce"; duration?: number; delay?: number; easing?: string; }
interface SEOMetadata { title: string; description: string; ogTitle?: string; ogDescription?: string; ogImage?: string; }
```

### 4.5 Design Tokens System ⭐ NEW

```typescript
interface DesignTokens {
  colors: { primary: string; secondary: string; accent: string; background: string; text: string; };
  typography: { fontFamily: string; baseFontSize: string; headingScale: number; };
  buttons: { borderRadius: string; fontWeight: string; };
  spacing: { base: number; };
}

// Defaults: Stackly brand colors (#0B1D40 primary, #3b82f6 secondary, #f59e0b accent)
// applyDesignTokens() cascades token changes to all components on the canvas
// Persisted to localStorage under key "stackly-design-tokens"
```

### 4.6 Section Templates System ⭐ NEW

Pre-designed, ready-to-use section configurations (inspired by Zoho Sites):

| Category | Templates | Component Types Used |
|---|---|---|
| Hero | Centered Hero, Gradient Hero | `hero` |
| Features | Feature Grid | `features` |
| Pricing | Three-Tier Pricing | `pricing-table` |
| Testimonials | Testimonial Cards | `testimonial` |
| FAQ | FAQ Accordion | `heading` + `accordion` |
| CTA | Newsletter CTA, Countdown CTA | `contact`, `countdown` |
| Footer | Full Footer | `footer` |
| Contact | Contact Form, Contact with Map | `form`, `heading` + `text` + `map` + `social-links` |

### 4.7 Project Management System ⭐ NEW

```typescript
interface Project {
  id: string;           // UUID
  name: string;
  category: string;     // "E-commerce" | "Portfolio" | "Blog" | "Business" | "Restaurant"
  style: string;        // "Modern" | "Minimal" | "Bold"
  sections: string[];   // Selected sections
  thumbnail?: string;
  components?: BuilderComponent[];
  designTokens?: DesignTokens;
  createdAt: string;    // ISO timestamp
  updatedAt: string;
}

// Currently stored in localStorage under "stackly_projects"
// Migration path: Replace localStorage with backend API calls
```

### 4.8 Analytics System ⭐ NEW

```typescript
interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  todayViews: number;
  weeklyViews: number;
  dailyTraffic: DailyTraffic[];    // { date, views, visitors }
  weeklyTraffic: WeeklyTraffic[];  // { week, views, visitors }
  topPages: TopPage[];              // { page, views, percentage }
  recentActivity: AnalyticsEvent[]; // Last 20 events
}

// Currently: localStorage-based tracking (client-side only)
// Migration path: Replace with server-side event ingestion API
// Demo data: seedDemoAnalytics() generates 30 days of realistic traffic
```

### 4.9 Responsive Design Model

```typescript
type Viewport = "desktop" | "tablet" | "mobile";
const VIEWPORT_WIDTHS = { desktop: 1280, tablet: 768, mobile: 390 };

// Future: per-breakpoint style overrides
type ResponsiveStyles = {
  sm?: Partial<ComponentStyles>;  // 640px
  md?: Partial<ComponentStyles>;  // 768px
  lg?: Partial<ComponentStyles>;  // 1024px
};
```

### 4.10 Asset Management System

```typescript
interface Asset {
  id: string;           // UUID
  name: string;         // Original filename
  mimeType: string;     // image/png, image/webp, etc.
  size: number;         // Bytes (after compression)
  width?: number;
  height?: number;
  thumbnail: string;    // 160×160 WebP data-URL
  uploadedAt: number;   // Timestamp
  tags: string[];
}

// Storage: IndexedDB (two stores: "assets" metadata + "blobs" raw data)
// Migration path: Replace dbPutAsset/dbGetBlob with S3 API calls
// URL resolution: useAssetStore.getUrl(id) → object URL (cached)
```

### 4.11 Canvas Modes

| Mode | Description | Implementation |
|---|---|---|
| **Flow** (default) | Stacked vertical layout with sortable drag-and-drop | `Canvas.tsx` + `SortableItem.tsx` |
| **Freeform** ⭐ NEW | Wix-style absolute positioning with snap guides | `FreeformCanvas.tsx` + `FreeformItem.tsx` + `SnapGuides.tsx` + `ResizeHandles.tsx` |

Freeform mode features:
- Absolute positioning (x, y) snapped to 8px grid
- Multi-select (Shift+Click) via `selectedComponentIds`
- Copy/paste with clipboard (localStorage cross-tab support)
- Layer ordering (bring to front/back, forward/backward)
- Component locking (prevent editing/moving)
- Resize handles with snap-to-grid
- Smart snap alignment guides

---

## 5. Module-by-Module Status Audit

### MODULE 1: Authentication & User Management

| Task | Status | Details |
|---|---|---|
| Login UI | ✅ Done | `app/login/page.tsx` (27KB) — email/mobile + password, validation |
| Signup UI | ✅ Done | `app/signup/page.tsx` (36KB) — name, email, mobile, password, confirm |
| Forgot password UI | ✅ Done | `app/forgot-password/page.tsx` — email/mobile input |
| Email OTP verification UI | ✅ Done | `app/verify-email/page.tsx` — 4-digit OTP, timer, resend |
| Mobile OTP verification UI | ✅ Done | `app/verify-mobile/page.tsx` — 4-digit OTP, timer, resend |
| Password reset UI | ✅ Done | `app/create-new-password/page.tsx` — new password form |
| Google OAuth button | ✅ Done | `components/AuthGoogleButton.tsx` + `lib/googleAuth.ts` |
| API client (frontend) | ✅ Done | `lib/api.ts` — register, login, forgotPassword, verifyEmailOtp, verifyMobileOtp, resetPassword |
| Backend auth controller | ✅ Done | `test/controllers/authController.js` — Node.js/Express reference implementation |
| Email validation rules | ✅ Done | `lib/emailValidation.ts` — domain whitelist, format checks |
| OTP input handlers | ✅ Done | `lib/otpInputHandlers.ts` — auto-focus, paste handling |
| Backend error page | ✅ Done | `app/backend-error/` — shows when API is unreachable |
| Profile settings UI | ⚠️ Partial | Settings page exists at `app/dashboard/settings/` but no profile editing |
| JWT/session storage (frontend) | ⚠️ Partial | Token received from API but no persistent session management |
| Plan tagging (Free/Premium) | ⚠️ Partial | Planning page shows plans but no user-level plan state |
| Payment gateway | ✅ Done | Razorpay integration: client SDK + standalone API server |
| Subscription lifecycle | ❌ Not started | No upgrade/downgrade/cancel flow |
| Feature access control | ❌ Not started | No gate based on plan |

---

### MODULE 2: Workspace & Dashboard ⭐ MAJOR UPDATE

| Task | Status | Details |
|---|---|---|
| Dashboard UI | ✅ Done | `app/dashboard/page.tsx` — project listing with stats cards |
| Dashboard header | ✅ Done | `components/dashboard/DashboardHeader.tsx` — search + create button |
| Project grid | ✅ Done | `components/dashboard/ProjectGrid.tsx` — responsive grid layout |
| Project cards | ✅ Done | `components/dashboard/ProjectCard.tsx` — thumbnail, edit, delete, duplicate |
| Create Project modal | ✅ Done | `components/dashboard/CreateProjectModal.tsx` — full creation wizard |
| Empty state | ✅ Done | `components/dashboard/EmptyProjects.tsx` — CTA when no projects |
| Stats cards | ✅ Done | `components/dashboard/StatsCards.tsx` — project count, total views, etc. |
| Project settings form | ✅ Done | `components/dashboard/ProjectSettingsForm.tsx` — rename, category, style |
| Settings page | ✅ Done | `app/dashboard/settings/page.tsx` — project settings |
| Create Project flow | ✅ Done | `CreateProjectFlow.tsx` — 4-step wizard (name → category → style → sections) |
| Project CRUD (client) | ✅ Done | `store/projectStore.ts` — create, update, delete, duplicate, rename |
| Project search & sort | ✅ Done | Search by name/category, sort by updatedAt/createdAt/name |
| Project state persistence | ⚠️ localStorage | `localStorage` save/load — **needs migration to backend API** |

---

### MODULE 3: Template Library

| Task | Status | Details |
|---|---|---|
| Template data structure | ✅ Done | `categoryCopy` in builderStore + `SectionTemplate` interface |
| Section templates library | ✅ Done | `lib/sectionTemplates.ts` — 12 pre-designed sections across 8 categories |
| Section templates UI | ✅ Done | `components/builder/SectionTemplates.tsx` — browse + insert |
| Base templates | ⚠️ Partial | 5 categories defined (E-commerce, Portfolio, Blog, Business, Restaurant) with copy but no full template JSON |
| Template preview | ⚠️ Partial | Portfolio, E-commerce, Restaurant pages serve as showcases |
| "Use Template" flow | ✅ Done | `loadWebsiteFromRequirements()` builds components from category selection |
| Clone template into project | ❌ Not started | No server-side template cloning |

---

### MODULE 4: Drag-and-Drop Builder ⭐ (SIGNIFICANTLY EXPANDED)

| Task | Status | Details |
|---|---|---|
| Editor canvas UI | ✅ Done | `Canvas.tsx` (21KB) — droppable zone, toolbar, viewport switcher |
| Drag-and-drop system | ✅ Done | @dnd-kit with palette→canvas + canvas reordering |
| Flow mode | ✅ Done | Stacked vertical layout with sortable drag-and-drop |
| Freeform mode ⭐ NEW | ✅ Done | `FreeformCanvas.tsx` — Wix-style absolute positioning |
| Snap guides ⭐ NEW | ✅ Done | `SnapGuides.tsx` — smart alignment helpers |
| Resize handles ⭐ NEW | ✅ Done | `ResizeHandles.tsx` — corner/edge resizing |
| Multi-select ⭐ NEW | ✅ Done | Shift+Click via `selectedComponentIds` |
| Copy/paste ⭐ NEW | ✅ Done | Clipboard + localStorage cross-tab support |
| Component locking ⭐ NEW | ✅ Done | `toggleLock()` — prevent editing/moving |
| Layer ordering ⭐ NEW | ✅ Done | `moveLayer()` — front/back/forward/backward |
| Context menu ⭐ NEW | ✅ Done | `ContextMenu.tsx` — right-click actions |
| Quick insert bar ⭐ NEW | ✅ Done | `QuickInsertBar.tsx` — fast component insertion |
| Zoom controls ⭐ NEW | ✅ Done | `ZoomControls.tsx` — 25%–200% canvas zoom |
| 25 component types | ✅ Done | All 25 types rendering on canvas |
| Global styles panel ⭐ NEW | ✅ Done | `GlobalStylesPanel.tsx` — design tokens editor |
| SEO panel ⭐ NEW | ✅ Done | `SEOPanel.tsx` — title, description, OG tags |
| Effects tab ⭐ NEW | ✅ Done | `EffectsTab.tsx` — opacity, shadow, border, transform, transitions |
| Styling controls | ✅ Done | `StyleTab` — color, bg, padding, margin, border-radius, font-size, font-family, font-weight, text-align |
| Component settings panel | ✅ Done | `PropertyEditor` (18KB) with Content/Style/Effects/Layers tabs |
| Save as JSON | ✅ Done | `saveToLocalStorage()` — serializes components array |
| Load JSON | ✅ Done | `loadFromLocalStorage()` — deserializes components |
| Load components ⭐ NEW | ✅ Done | `loadComponents()` — load from project data |
| Apply design tokens ⭐ NEW | ✅ Done | `applyDesignTokens()` — cascade tokens to all components |
| Clear canvas ⭐ NEW | ✅ Done | `clearCanvas()` — reset canvas |
| Undo/redo | ✅ Done | 50-step history with Ctrl+Z / Ctrl+Shift+Z |
| Keyboard shortcuts | ✅ Done | Ctrl+Z/Y, Ctrl+S, Ctrl+D, Ctrl+C/V, Delete, Escape |
| Inline text editing | ✅ Done | `InlineText.tsx` — click-to-edit on canvas |
| Layers panel | ✅ Done | `LayersPanel.tsx` — component tree view |
| Asset manager | ✅ Done | `AssetManager.tsx` — upload, browse, delete images from IndexedDB |
| Starter website | ✅ Done | One-click "Create Starter Website" loads 5 default blocks |
| Requirements-based generation | ✅ Done | Category-aware content generation from project wizard |
| Section templates ⭐ NEW | ✅ Done | 12 pre-designed sections insertable from builder |

---

### MODULE 5: Preview & Responsive Design

| Task | Status | Details |
|---|---|---|
| Preview renderer | ✅ Done | `PreviewModal.tsx` — renders exported HTML in sandboxed iframe |
| Desktop preview | ✅ Done | Full-width frame |
| Mobile preview | ✅ Done | 375px frame |
| Tablet preview | ✅ Done | 768px frame |
| Responsive breakpoints | ⚠️ Partial | Viewport widths defined (1280/768/390) but no per-breakpoint style overrides saved yet |
| Live preview sync | ✅ Done | Preview re-generates HTML from current components on open |
| Browser chrome mockup | ✅ Done | Fake browser bar with traffic light dots |
| Canvas zoom ⭐ NEW | ✅ Done | `ZoomControls.tsx` — 25%–200% zoom level |

---

### MODULE 6: Domain & Hosting

| Task | Status | Details |
|---|---|---|
| All tasks | ❌ Not started | No domain or hosting infrastructure |

---

### MODULE 7: Publishing System

| Task | Status | Details |
|---|---|---|
| JSON → static HTML | ✅ Done | `lib/exportHtml.ts` (18KB) — full HTML document generation |
| CSS generation | ✅ Done | Inline styles + embedded `<style>` block with responsive rules |
| Export/download | ✅ Done | `downloadHtml()` — creates blob and triggers download |
| Navigation responsive | ✅ Done | Hamburger menu with JS toggle in exported HTML |
| Publish button | ❌ Not started | No server-side publish |
| Deploy to S3 | ❌ Not started | No cloud deployment pipeline |
| Deployment status | ❌ Not started | No status tracking |
| Version history | ❌ Not started | No version storage |
| Rollback | ❌ Not started | No rollback mechanism |

---

### MODULE 8: E-commerce

| Task | Status | Details |
|---|---|---|
| E-commerce showcase page | ✅ Done | `app/e-commerce/page.tsx` (96KB) — product layouts, store templates |
| Pricing table component ⭐ NEW | ✅ Done | `PricingTableComponent.tsx` — multi-tier pricing cards |
| Product schema | ❌ Not started | No database model |
| Product CRUD APIs | ❌ Not started | |
| Cart system | ❌ Not started | |
| Checkout flow | ❌ Not started | |
| Payment integration | ⚠️ Partial | Razorpay client exists but tied to plan subscription, not product checkout |
| Order management | ❌ Not started | |

---

### MODULE 9: Blog & SEO

| Task | Status | Details |
|---|---|---|
| Blog page UI | ✅ Done | `app/blog/page.tsx` (29KB) + `blog.css` (39KB) |
| Blog header | ✅ Done | `components/blog/BlogHeader.tsx` (14KB) |
| Blog categories | ✅ Done | `lib/blogCategories.ts` — category data |
| SEO metadata types ⭐ NEW | ✅ Done | `types/builder.ts` — `SEOMetadata` interface |
| SEO panel UI ⭐ NEW | ✅ Done | `components/builder/SEOPanel.tsx` — title, desc, OG tags editor |
| SEO state ⭐ NEW | ✅ Done | `store/designStore.ts` — `seo` field with defaults |
| Blog post schema | ❌ Not started | No database model |
| Blog editor UI | ❌ Not started | No rich text editor |
| Post CRUD | ❌ Not started | |
| Slug-based URLs | ❌ Not started | |
| Sitemap.xml | ❌ Not started | |
| Open Graph tags | ⚠️ Partial | SEO panel built, but no per-page OG injection on publish |

---

### MODULE 10: Analytics Dashboard ⭐ MAJOR UPDATE

| Task | Status | Details |
|---|---|---|
| Analytics types | ✅ Done | `types/analytics.ts` — events, daily/weekly traffic, top pages |
| Analytics tracking engine | ✅ Done | `lib/analytics.ts` — `trackPageView()`, `trackVisitor()`, `getAnalyticsData()` |
| Analytics dashboard page | ✅ Done | `app/dashboard/analytics/page.tsx` — full analytics view |
| KPI summary cards | ✅ Done | `components/analytics/AnalyticsCards.tsx` — total views, unique visitors, today, weekly |
| Views chart | ✅ Done | `components/analytics/ViewsChart.tsx` — Recharts line chart |
| Visitors chart | ✅ Done | `components/analytics/VisitorsChart.tsx` — Recharts line chart |
| Top pages table | ✅ Done | `components/analytics/TopPages.tsx` — ranked page list |
| Activity log | ✅ Done | `components/analytics/ActivityTable.tsx` — recent events |
| Demo data seeder | ✅ Done | `seedDemoAnalytics()` — 30 days of realistic traffic |
| Date filter | ✅ Done | today / 7 days / 30 days filter |
| Server-side tracking | ❌ Not started | Currently localStorage only — **needs server migration** |

---

### MODULE 11: AI Content Assistant

| Task | Status | Details |
|---|---|---|
| AI hints in block specs | ⚠️ Partial | `BlockSpec.ai` field defined with `description` + `exampleOutput` but not wired to any API |
| AI text generation | ❌ Not started | No API integration |
| AI image generation | ❌ Not started | |
| Layout suggestions | ❌ Not started | |

---

## 6. Existing API Contracts (Frontend → Backend)

### Base URL
```
NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000/api"
```

### Auth Endpoints (Already Built in Frontend)

| Method | Path | Request Body | Response | Status |
|---|---|---|---|---|
| POST | `/auth/register` | `{ name, email, mobile, password, confirmPassword }` | `{ message }` | Frontend ✅ Backend ✅ (reference) |
| POST | `/auth/login` | `{ email?, mobile?, password }` | `{ message, token, userType }` | Frontend ✅ Backend ✅ (reference) |
| POST | `/auth/forgot-password` | `{ input, isChange?, primaryUser? }` | `{ message, otp?, moveToVerify? }` | Frontend ✅ Backend ✅ (reference) |
| POST | `/auth/verify-email` | `{ email, otp?, action?: "resend" }` | `{ token?, message, otp? }` | Frontend ✅ Backend ✅ (reference) |
| POST | `/auth/verify-mobile` | `{ mobile, otp?, action?: "resend" }` | `{ token?, message, otp? }` | Frontend ✅ Backend ✅ (reference) |
| POST | `/auth/reset-password` | `{ newPassword, confirmPassword }` + `Authorization: Bearer <token>` | `{ message }` | Frontend ✅ Backend ✅ (reference) |
| GET | `/auth/google?code=...&state=login\|signup` | (OAuth redirect) | Redirect to `/landing?token=...` | Frontend ✅ Backend ❌ |

### Payment Endpoints (Standalone Server on :3001)

| Method | Path | Request Body | Response |
|---|---|---|---|
| POST | `/api/razorpay/create-order` | `{ amountPaise, planName, billingPeriod }` | `{ orderId, amount, currency, keyId }` |
| POST | `/api/razorpay/verify` | `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }` | `{ verified: boolean }` |

### APIs Needed (Not Built Yet)

```
# User Profile
GET    /api/users/me                    → { id, name, email, mobile, plan, avatar }
PUT    /api/users/me                    → { name, avatar, ... }

# Projects
POST   /api/projects                    → { id, name, ... }
GET    /api/projects                    → [ { id, name, thumbnail, updatedAt } ]
GET    /api/projects/:id                → { id, name, components, designTokens, ... }
PUT    /api/projects/:id                → { components, designTokens, ... }
DELETE /api/projects/:id                → { success }
POST   /api/projects/:id/duplicate      → { id (new) }
PUT    /api/projects/:id/autosave       → { success }

# Templates
GET    /api/templates                   → [ { id, name, category, thumbnail, isPremium } ]
GET    /api/templates/:id               → { id, components, ... }
POST   /api/templates/:id/clone         → { projectId (new) }

# Publishing
POST   /api/projects/:id/publish        → { deploymentId, status, url }
GET    /api/projects/:id/deployments    → [ { id, version, publishedAt, status, url } ]
POST   /api/projects/:id/rollback/:ver  → { success }

# Domains
POST   /api/projects/:id/domain         → { domain, verificationRecord }
GET    /api/projects/:id/domain/verify  → { verified, sslStatus }

# Blog (Future)
POST   /api/projects/:id/posts          → { id, slug, ... }
GET    /api/projects/:id/posts          → [ posts ]
PUT    /api/projects/:id/posts/:postId  → { ... }
DELETE /api/projects/:id/posts/:postId  → { success }

# E-commerce (Future)
POST   /api/projects/:id/products       → { id, ... }
GET    /api/projects/:id/products       → [ products ]
POST   /api/projects/:id/orders         → { orderId, ... }
GET    /api/projects/:id/orders         → [ orders ]

# Analytics
POST   /api/analytics/events            → { success }  (tracking pixel)
GET    /api/projects/:id/analytics      → { views, visitors, dailyStats, topPages }

# AI (Future)
POST   /api/ai/generate-text            → { text }
POST   /api/ai/generate-image           → { imageUrl }
POST   /api/ai/suggest-layout           → { components: JSON }
```

---

## 7. Database Models Needed (Backend Team Reference)

### User Model (MongoDB)

```javascript
{
  _id: ObjectId,
  name: String,           // required
  email: String,          // unique, lowercase
  mobile: String,         // unique, 10 digits
  password: String,       // bcrypt hashed
  passwordHistory: [String], // last 3 hashes (prevent reuse)
  alternates: [String],   // alternate emails/mobiles (max 2 each)
  otp: String,            // current OTP (nullable)
  otpExpiry: Number,      // timestamp
  otpAttempts: Number,    // 0-3
  plan: {
    type: String,         // "free" | "starter" | "pro" | "enterprise"
    expiresAt: Date,
    razorpaySubscriptionId: String,
    features: [String],   // enabled feature flags
  },
  avatar: String,         // URL
  googleId: String,       // OAuth
  createdAt: Date,
  updatedAt: Date,
}
```

### Project Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId,       // ref: User
  name: String,
  category: String,       // "E-commerce" | "Portfolio" | "Blog" | "Business" | "Restaurant"
  style: String,          // "Modern" | "Minimal" | "Bold"
  sections: [String],     // Selected sections during creation
  components: JSON,       // BuilderComponent[] serialized
  designTokens: JSON,     // DesignTokens object (colors, typography, buttons, spacing)
  seo: {                  // SEO metadata
    title: String,
    description: String,
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
  },
  thumbnail: String,      // Auto-generated preview image URL
  domain: {
    subdomain: String,    // e.g., "mysite" → mysite.stackly.studio
    customDomain: String, // e.g., "www.example.com"
    verified: Boolean,
    sslStatus: String,
  },
  publishedAt: Date,
  publishedUrl: String,
  createdAt: Date,
  updatedAt: Date,
}
```

### Deployment Model

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,    // ref: Project
  version: Number,
  s3Key: String,          // path in S3 bucket
  htmlSnapshot: String,   // exported HTML
  status: String,         // "building" | "deployed" | "failed" | "rolled_back"
  publishedAt: Date,
  publishedBy: ObjectId,  // ref: User
}
```

### Template Model

```javascript
{
  _id: ObjectId,
  name: String,
  category: String,
  style: String,
  description: String,
  thumbnail: String,
  components: JSON,       // BuilderComponent[] — the template layout
  designTokens: JSON,     // Default design tokens for the template
  isPremium: Boolean,
  popularity: Number,     // usage count
  createdBy: ObjectId,    // admin user
  createdAt: Date,
}
```

### Analytics Event Model (for server-side tracking)

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,    // ref: Project — which published site
  page: String,           // "/" | "/about" | "/products"
  sessionId: String,      // Client-generated session UUID
  visitorId: String,      // Persistent cookie-based visitor ID
  referrer: String,       // HTTP referrer
  userAgent: String,      // Browser user-agent
  ip: String,             // Hashed for privacy
  country: String,        // GeoIP lookup
  device: String,         // "desktop" | "mobile" | "tablet"
  timestamp: Date,
}
```

---

## 8. Environment Variables

### Currently Used (Frontend)

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base | `http://localhost:5000/api` |
| `NEXT_PUBLIC_BASE_PATH` | GitHub Pages subpath | `""` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | hardcoded fallback |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key | (required for payments) |
| `NEXT_PUBLIC_RAZORPAY_DEMO` | Force demo mode | `"true"` |
| `NEXT_PUBLIC_RAZORPAY_API_BASE` | Razorpay API URL | `http://localhost:3001` |

### Needed for Backend (Node.js + MongoDB)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string (MongoDB Atlas recommended) |
| `JWT_SECRET` | JWT access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `JWT_ACCESS_EXPIRY` | Access token TTL (e.g., `"15m"`) |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL (e.g., `"7d"`) |
| `SENDGRID_API_KEY` | Email OTP delivery |
| `TWILIO_SID` / `TWILIO_AUTH_TOKEN` | SMS OTP delivery |
| `GOOGLE_CLIENT_SECRET` | Google OAuth server-side |
| `RAZORPAY_KEY_SECRET` | Razorpay server-side secret |
| `OPENAI_API_KEY` | AI content generation (future) |
| `NODE_ENV` | Environment (`development` / `staging` / `production`) |
| `PORT` | Server port (default `5000`) |
| `CORS_ORIGIN` | Allowed frontend origins |

### Needed for AWS DevOps

| Variable | Purpose |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM programmatic access |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `AWS_REGION` | AWS region (e.g., `ap-south-1` for India) |
| `S3_BUCKET_NAME` | Site hosting bucket (e.g., `stackly-sites`) |
| `S3_ASSETS_BUCKET` | User-uploaded assets bucket |
| `CLOUDFRONT_DISTRIBUTION_ID` | CDN distribution for site hosting |
| `CLOUDFRONT_ASSETS_DISTRIBUTION_ID` | CDN for asset delivery |
| `ROUTE53_HOSTED_ZONE_ID` | DNS hosted zone for `stackly.studio` |
| `ACM_CERTIFICATE_ARN` | SSL wildcard cert for `*.stackly.studio` |
| `JENKINS_URL` | Jenkins server URL |
| `JENKINS_API_TOKEN` | Jenkins API authentication |
| `ECR_REPOSITORY_URI` | Container registry for backend Docker images |
| `ECS_CLUSTER_NAME` | ECS cluster name (or EC2 instance IDs) |

---

## 9. Detailed Backend Team Tasks (Node.js + Express + MongoDB)

> **Stack**: Node.js (v20+) + Express.js + MongoDB (Atlas) + Mongoose ODM  
> **API Base URL**: `http://localhost:5000/api` (frontend already pointing here)

### 9.1 Priority 1 — Auth & User Service (Week 1-2)

| # | Task | Details | Frontend Dependency |
|---|---|---|---|
| B1 | **Deploy auth controller** | Port `test/controllers/authController.js` to proper Express server with MongoDB Atlas. Set up Mongoose schemas, bcrypt hashing, JWT generation. | `lib/api.ts` already calls these endpoints |
| B2 | **JWT refresh token rotation** | Implement `POST /auth/refresh-token` — store refresh tokens in MongoDB (or Redis), rotate on use, invalidate on logout. Access token = 15min, Refresh = 7 days. | Frontend needs to add interceptor for 401 → refresh flow |
| B3 | **Email OTP delivery** | Integrate SendGrid (or AWS SES) — replace `console.log(otp)` in auth controller with actual email sending. Use HTML templates. | `app/verify-email/page.tsx` already handles OTP input |
| B4 | **SMS OTP delivery** | Integrate Twilio or MSG91 — send OTP via SMS for mobile verification. Rate-limit: max 3 OTPs per number per hour. | `app/verify-mobile/page.tsx` already handles OTP input |
| B5 | **Google OAuth callback** | Implement `GET /api/auth/google?code=...&state=login\|signup` — exchange code for Google user info, create/find user, return JWT. Redirect to `/landing?token=...` | `lib/googleAuth.ts` already constructs the redirect URL |
| B6 | **User profile endpoints** | `GET /api/users/me` — return user profile. `PUT /api/users/me` — update name, avatar, etc. Protected by JWT middleware. | `app/dashboard/settings/page.tsx` will consume this |
| B7 | **Logout & token invalidation** | `POST /api/auth/logout` — invalidate refresh token. Optionally maintain a token blacklist (Redis). | Frontend needs logout button wiring |

### 9.2 Priority 2 — Project CRUD (Week 2-3)

| # | Task | Details | Frontend Dependency |
|---|---|---|---|
| B8 | **Project model (Mongoose)** | Schema: `{ userId, name, category, style, sections, components(JSON), designTokens(JSON), seo(JSON), thumbnail, domain, publishedAt, publishedUrl, createdAt, updatedAt }`. Index on `userId`. | `types/project.ts` defines the frontend shape |
| B9 | **Create project** | `POST /api/projects` — body: `{ name, category, style, sections }`. Auto-set `userId` from JWT. Return full project. | `store/projectStore.ts` → `createProject()` needs API migration |
| B10 | **List user projects** | `GET /api/projects` — return all projects for authenticated user. Support `?search=`, `?sort=`, `?order=`. Paginate (limit/offset). | `store/projectStore.ts` → `loadProjects()` needs API migration |
| B11 | **Get single project** | `GET /api/projects/:id` — return project with full `components` JSON. Validate ownership. | Builder loads project from this |
| B12 | **Update project** | `PUT /api/projects/:id` — partial update (components, designTokens, seo, name). Validate ownership. | `store/projectStore.ts` → `updateProject()` |
| B13 | **Auto-save endpoint** | `PUT /api/projects/:id/autosave` — accepts `{ components, designTokens }`. Debounced from frontend (every 30s). Return `{ success, savedAt }`. | `store/designStore.ts` → `autoSaveEnabled` flag ready |
| B14 | **Delete project** | `DELETE /api/projects/:id` — soft delete (set `deletedAt`). Validate ownership. Also delete from S3 if published. | `store/projectStore.ts` → `deleteProject()` |
| B15 | **Duplicate project** | `POST /api/projects/:id/duplicate` — deep clone project with new ID, "(Copy)" suffix. Return new project. | `store/projectStore.ts` → `duplicateProject()` |
| B16 | **Thumbnail generation** | On project save/publish, generate a thumbnail (Puppeteer screenshot or canvas-based). Store in S3, save URL in project model. | Dashboard `ProjectCard.tsx` shows thumbnails |

### 9.3 Priority 3 — Templates & Publishing (Week 3-5)

| # | Task | Details | Frontend Dependency |
|---|---|---|---|
| B17 | **Template model & CRUD** | `GET /api/templates` (filterable by category, isPremium). `GET /api/templates/:id`. Admin-only: `POST/PUT/DELETE /api/admin/templates`. | `lib/sectionTemplates.ts` has client-side templates; server adds shared/premium ones |
| B18 | **Template clone → project** | `POST /api/templates/:id/clone` — create new project from template for the authenticated user. | "Use Template" button in frontend |
| B19 | **Publish endpoint** | `POST /api/projects/:id/publish` — run `exportHtml()` server-side, upload to S3, create CloudFront invalidation, return `{ deploymentId, url }`. | Frontend "Publish" button |
| B20 | **Deployment tracking** | Store deployments in MongoDB: `{ projectId, version, s3Key, htmlSnapshot, status, publishedAt }`. `GET /api/projects/:id/deployments`. | Frontend deployment history panel |
| B21 | **Rollback** | `POST /api/projects/:id/rollback/:version` — copy old S3 version to current, invalidate CDN. | Frontend rollback button |
| B22 | **Subdomain allocation** | On first publish, generate unique subdomain (e.g., `mysite-abc123.stackly.studio`). Store in project model. | Frontend shows "Visit Site" link |

### 9.4 Priority 4 — Analytics & Advanced (Week 5-7)

| # | Task | Details | Frontend Dependency |
|---|---|---|---|
| B23 | **Analytics event ingestion** | `POST /api/analytics/events` — receive `{ projectId, page, sessionId, visitorId, referrer, userAgent }`. Batch insert to MongoDB. | Replace `lib/analytics.ts` localStorage tracking |
| B24 | **Analytics query API** | `GET /api/projects/:id/analytics?filter=7days` — aggregate views, unique visitors, daily/weekly traffic, top pages. Return same shape as `AnalyticsData` type. | `app/dashboard/analytics/page.tsx` consumes this |
| B25 | **Tracking script generator** | Generate a `<script>` tag injected into published sites that sends page view events to `POST /api/analytics/events`. Include sessionId + visitorId (cookie). | `lib/exportHtml.ts` needs to inject tracking script |
| B26 | **Razorpay integration (server-side)** | Migrate Razorpay from standalone `:3001` server into main Express app. Implement subscription lifecycle: create, verify, webhook handler, cancel. | `lib/razorpayClient.ts` changes API base URL |
| B27 | **Subscription management** | `GET /api/subscription`, `POST /api/subscription/upgrade`, `POST /api/subscription/cancel`. Update user plan state. Implement feature gating middleware. | Frontend planning page + feature locks |
| B28 | **Asset upload to S3** | `POST /api/assets/upload` — accept multipart file, compress (sharp), upload to S3, return `{ id, url, thumbnail }`. `GET /api/assets`, `DELETE /api/assets/:id`. | Replace `lib/assetDb.ts` IndexedDB with S3 |
| B29 | **Custom domain API** | `POST /api/projects/:id/domain` — accept custom domain, generate CNAME record. `GET /api/projects/:id/domain/verify` — check DNS propagation + SSL status. | Frontend custom domain input UI |

### 9.5 Priority 5 — Future Features (Week 8+)

| # | Task | Details |
|---|---|---|
| B30 | **Blog post CRUD** | `POST/GET/PUT/DELETE /api/projects/:id/posts`. Slug generation, markdown support, image uploads. |
| B31 | **E-commerce product CRUD** | `POST/GET/PUT/DELETE /api/projects/:id/products`. Cart, checkout, order management. |
| B32 | **AI proxy API** | `POST /api/ai/generate-text`, `POST /api/ai/generate-image`, `POST /api/ai/suggest-layout`. OpenAI/Anthropic integration with rate limiting. |
| B33 | **Content moderation** | Automated content check for AI-generated and user-uploaded content. |
| B34 | **Team collaboration** | Share projects with team members, role-based access (owner, editor, viewer). |

---

## 10. Detailed AWS DevOps Team Tasks (AWS + Jenkins)

> **Stack**: AWS (S3, CloudFront, Route 53, ACM, Lambda, API Gateway, EC2/ECS, CloudWatch) + Jenkins CI/CD  
> **Region**: `ap-south-1` (Mumbai) recommended for India-first market

### 10.1 Priority 1 — AWS Infrastructure Setup (Week 1-2)

| # | Task | Details |
|---|---|---|
| D1 | **AWS account & IAM setup** | Create production AWS account. Set up IAM users/roles: `stackly-backend` (programmatic access for Node.js server), `stackly-jenkins` (CI/CD pipeline access), `stackly-admin` (console access). Follow least-privilege principle. |
| D2 | **VPC & networking** | Create VPC with public + private subnets across 2 AZs. NAT Gateway for private subnet outbound. Security groups for: backend server (port 5000), MongoDB Atlas peering, S3/CloudFront access. |
| D3 | **MongoDB Atlas peering** | Set up VPC peering with MongoDB Atlas cluster. Whitelist VPC CIDR in Atlas Network Access. Test connectivity from backend EC2/ECS. |
| D4 | **S3 bucket: `stackly-sites`** | Create S3 bucket for published sites. Structure: `s3://stackly-sites/{userId}/{projectId}/index.html`. Enable static website hosting. Bucket policy: allow CloudFront OAI read access. |
| D5 | **S3 bucket: `stackly-assets`** | Create S3 bucket for user-uploaded images/assets. Structure: `s3://stackly-assets/{userId}/{assetId}.webp`. CORS config to allow frontend uploads. |
| D6 | **S3 bucket: `stackly-templates`** | Create S3 bucket for template thumbnails and preview images. Public read via CloudFront. |
| D7 | **CloudFront distribution: sites** | Create distribution pointing to `stackly-sites` S3 bucket. Custom error pages (404 → index.html for SPA). Enable GZIP/Brotli compression. Cache policy: 24hr default, 0 for HTML files. |
| D8 | **CloudFront distribution: assets** | Create distribution for `stackly-assets` bucket. Long cache TTL for immutable assets. Custom headers: `Cache-Control: public, max-age=31536000, immutable`. |
| D9 | **Route 53 hosted zone** | Register/transfer `stackly.studio` domain. Create hosted zone. Set up NS records. |
| D10 | **ACM certificate** | Request wildcard SSL cert: `*.stackly.studio` + `stackly.studio` in ACM (us-east-1 for CloudFront). DNS validation via Route 53. |
| D11 | **Wildcard subdomain routing** | Route 53 CNAME: `*.stackly.studio` → CloudFront distribution. Lambda@Edge function to route `{subdomain}.stackly.studio` to correct S3 path `/{userId}/{projectId}/`. |

### 10.2 Priority 2 — Backend Deployment (Week 2-3)

| # | Task | Details |
|---|---|---|
| D12 | **Dockerize backend** | Create `Dockerfile` for Node.js backend. Multi-stage build (build → production). Health check endpoint `/api/health`. |
| D13 | **ECR repository** | Create ECR repository `stackly/backend`. Push Docker images tagged with git SHA + `latest`. |
| D14 | **EC2 or ECS deployment** | **Option A (simpler)**: EC2 instance (t3.medium) with Docker, PM2 for process management, Nginx reverse proxy. **Option B (production)**: ECS Fargate cluster with auto-scaling, ALB, target groups. |
| D15 | **Application Load Balancer** | ALB with HTTPS listener (ACM cert for `api.stackly.studio`). Forward to ECS tasks or EC2 target group. Health checks on `/api/health`. |
| D16 | **Route 53: API subdomain** | A record: `api.stackly.studio` → ALB. Frontend `NEXT_PUBLIC_API_BASE_URL` = `https://api.stackly.studio/api` |
| D17 | **Environment management** | SSM Parameter Store or Secrets Manager for all backend env vars. Inject into ECS task definition or EC2 startup script. Separate parameters for dev/staging/prod. |
| D18 | **CloudWatch monitoring** | Set up CloudWatch alarms: CPU > 80%, memory > 80%, 5xx error rate > 1%, response time > 2s. Create dashboard with key metrics. SNS topic for alerts → email/Slack. |
| D19 | **Log aggregation** | CloudWatch Logs for backend application logs. Log groups: `/stackly/backend/access`, `/stackly/backend/error`, `/stackly/backend/application`. Set retention to 30 days. |

### 10.3 Priority 3 — Jenkins CI/CD Pipeline (Week 3-4)

| # | Task | Details |
|---|---|---|
| D20 | **Jenkins server setup** | Install Jenkins on EC2 (t3.medium). Install plugins: Docker Pipeline, AWS Steps, NodeJS, GitHub, Blue Ocean. Configure GitHub webhook for push events. |
| D21 | **Backend CI pipeline** | Jenkinsfile stages: `Checkout` → `Install Dependencies` → `Lint` → `Unit Tests` → `Build Docker Image` → `Push to ECR` → `Deploy to Staging`. Trigger on `develop` branch push. |
| D22 | **Backend CD pipeline** | Production deploy: Tag-based trigger (e.g., `v1.0.0`). Stages: `Pull from ECR` → `ECS Service Update` (or SSH deploy to EC2) → `Health Check` → `CloudFront Invalidation` → `Notify Slack`. |
| D23 | **Frontend CI pipeline** | Jenkinsfile: `Checkout` → `npm install` → `npm run lint` → `npm run build` → `Upload /out to S3` → `CloudFront Invalidation`. For the marketing site (not user-published sites). |
| D24 | **Staging environment** | Separate AWS resources: `stackly-sites-staging` S3 bucket, `staging.stackly.studio` subdomain, separate ECS service or EC2 instance. Auto-deploy from `develop` branch. |
| D25 | **Production deployment** | Blue-green deployment via ECS (or rolling update). Deployment approval gate in Jenkins (manual approval for prod). Rollback capability: keep last 3 ECS task definition revisions. |
| D26 | **Automated testing** | Jenkins runs API integration tests against staging after deploy. Use Postman/Newman collection or Jest test suite. Block production deploy on test failure. |

### 10.4 Priority 4 — Publishing Pipeline (Week 4-6)

| # | Task | Details |
|---|---|---|
| D27 | **Publish Lambda function** | Lambda function triggered by `POST /api/projects/:id/publish`: 1) Receive project JSON, 2) Generate HTML (import `exportHtml`), 3) Upload to S3 at `/{userId}/{projectId}/index.html`, 4) Create CloudFront invalidation, 5) Return deployment status. |
| D28 | **API Gateway for publish** | API Gateway REST endpoint → Lambda. Auth: JWT verification via custom authorizer Lambda. Rate limit: 10 publishes per user per hour. |
| D29 | **CloudFront invalidation** | After each publish, create invalidation for `/{userId}/{projectId}/*`. Use batch invalidation to stay within free tier (1000/month). |
| D30 | **Custom domain flow** | When user adds custom domain: 1) Create Route 53 CNAME record, 2) Request ACM cert for custom domain, 3) Validate DNS (poll every 30s for 10 min), 4) Add custom domain to CloudFront distribution, 5) Update project model with `verified: true, sslStatus: "active"`. |
| D31 | **SSL auto-provisioning** | Lambda triggered by domain verification: request ACM cert → DNS validation → wait for issued → add to CloudFront as alternate domain name. |
| D32 | **Publish webhook/notification** | After successful publish, send notification to user (email/in-app). Store deployment record in MongoDB. |

### 10.5 Priority 5 — Analytics Infrastructure (Week 6-8)

| # | Task | Details |
|---|---|---|
| D33 | **Analytics tracking script** | Lightweight JS snippet (~2KB) injected into published sites. Sends `POST /api/analytics/events` with page, sessionId, referrer, device info. Debounced, non-blocking. |
| D34 | **API Gateway: analytics** | High-throughput endpoint for event ingestion. API Gateway → SQS queue → Lambda → MongoDB (batch writes). This decouples ingestion from storage. |
| D35 | **Analytics aggregation** | Scheduled Lambda (CloudWatch Events, every 1 hour): aggregate raw events into daily/weekly summaries. Store in separate `analytics_daily` collection for fast dashboard queries. |
| D36 | **Real-time analytics (future)** | WebSocket API via API Gateway for live visitor count. DynamoDB TTL-based active session tracking. |

### 10.6 Priority 6 — Security & Reliability (Ongoing)

| # | Task | Details |
|---|---|---|
| D37 | **WAF (Web Application Firewall)** | AWS WAF on CloudFront + ALB. Rules: rate limiting (1000 req/min per IP), SQL injection protection, XSS protection, geo-blocking (if needed). |
| D38 | **DDoS protection** | AWS Shield Standard (automatic). Consider Shield Advanced for production. |
| D39 | **Backup strategy** | MongoDB Atlas: automated daily backups with 7-day retention. S3: enable versioning on all buckets. Cross-region replication for `stackly-sites` bucket. |
| D40 | **Disaster recovery** | Document RTO/RPO targets. MongoDB Atlas: multi-region cluster for failover. S3: cross-region replication. Route 53: health checks with failover routing. |
| D41 | **Cost monitoring** | AWS Budgets alert at $100/$500/$1000 thresholds. CloudWatch billing alarms. Tag all resources with `project:stackly`, `environment:prod/staging`. Monthly cost review. |
| D42 | **Secrets rotation** | Set up automatic rotation for RDS passwords (if used), API keys via Secrets Manager. Jenkins credentials stored in Jenkins Credential Manager, not in code. |

---

## 11. Roadmap & Team Coordination Plan

### Phase 1: Foundation (Weeks 1-3) — Backend + Cloud Setup

```
BACKEND TEAM (Node.js + MongoDB)       AWS DEVOPS TEAM (AWS + Jenkins)        FRONTEND TEAM
──────────────────────────────────      ──────────────────────────────────      ─────────────
B1. Deploy auth controller              D1. AWS account + IAM setup            ✅ Dashboard UI (DONE)
    to Express server with              D2. VPC + networking setup             ✅ Project CRUD store (DONE)
    MongoDB Atlas                       D3. MongoDB Atlas VPC peering          ✅ Analytics dashboard (DONE)
                                                                               ✅ Design tokens panel (DONE)
B2. Implement JWT refresh               D4. S3 bucket (stackly-sites)
    token rotation                      D5. S3 bucket (stackly-assets)
                                        D6. S3 bucket (stackly-templates)
B3. Set up SendGrid/SES for
    email OTP delivery                  D7. CloudFront distribution (sites)    1. Wire dashboard to
                                        D8. CloudFront distribution (assets)      project API (replace
B4. Set up Twilio/MSG91                                                           localStorage)
    for mobile OTP                      D9. Route 53 hosted zone
                                        D10. ACM wildcard certificate          2. Wire auth session
B5. Google OAuth callback               D11. Wildcard subdomain routing           persistence (store
    endpoint                                                                      token, refresh flow)
                                        D12. Dockerize backend
B6. User profile GET/PUT                D13. ECR repository                    3. Wire settings page
    /api/users/me                       D14. EC2 or ECS deployment                to user profile API
                                        D15. ALB + HTTPS
B7. Logout & token invalidation         D16. API subdomain DNS                 4. Migrate localStorage
                                        D17. Environment management               save → API autosave
B8-B15. Project CRUD API
    (create, list, get, update,         D18. CloudWatch monitoring             5. Migrate asset store
    delete, duplicate, autosave)        D19. Log aggregation                      to S3 uploads
```

### Phase 2: CI/CD + Publishing Pipeline (Weeks 4-6)

```
BACKEND TEAM                            AWS DEVOPS TEAM                        FRONTEND TEAM
──────────────                          ──────────────                         ─────────────
B17. Template CRUD API                  D20. Jenkins server setup              1. Add "Publish" button
                                        D21. Backend CI pipeline                  with loading state
B18. Template clone → project           D22. Backend CD pipeline
                                        D23. Frontend CI pipeline              2. Show deployment
B19. Publish endpoint                   D24. Staging environment                  status (success/fail)
    POST /api/projects/:id/publish      D25. Production deployment
                                        D26. Automated testing                 3. Build deployment
B20. Deployment version                                                           history panel
    tracking in MongoDB                 D27. Publish Lambda function
                                        D28. API Gateway for publish           4. Add "Visit Site"
B21. Rollback endpoint                  D29. CloudFront invalidation              link after publish
                                        D30. Custom domain flow
B22. Subdomain allocation               D31. SSL auto-provisioning             5. Build custom domain
                                        D32. Publish webhook                      input + verification UI
B26. Razorpay server-side
    integration (move from :3001)
```

### Phase 3: Analytics + Templates (Weeks 7-9)

```
BACKEND TEAM                            AWS DEVOPS TEAM                        FRONTEND TEAM
──────────────                          ──────────────                         ─────────────
B23. Analytics event ingestion          D33. Analytics tracking script         1. Migrate analytics
    POST /api/analytics/events              (inject into published sites)         dashboard to server API
                                                                                  (replace localStorage)
B24. Analytics query API                D34. API Gateway: analytics
    GET /api/projects/:id/analytics         (high-throughput ingestion)         2. Build template
                                                                                  browse/filter page
B25. Tracking script generator          D35. Analytics aggregation
                                            (hourly Lambda)                    3. Template preview
B27. Subscription management                                                      modal with "Use" button
    (upgrade/downgrade/cancel)          D37. WAF setup
                                        D38. DDoS protection                   4. Feature gating UI
B28. Asset upload to S3                 D39. Backup strategy                      (lock premium features)
    POST /api/assets/upload

B29. Custom domain API
```

### Phase 4: Blog + E-commerce + AI (Weeks 10-16)

```
BACKEND TEAM                            AWS DEVOPS TEAM                        FRONTEND TEAM
──────────────                          ──────────────                         ─────────────
B30. Blog post CRUD API                 D36. Real-time analytics               1. Blog editor UI
    with slug generation                    (WebSocket live visitors)              (rich text editor)

B31. E-commerce product CRUD           D40. Disaster recovery plan             2. Product management
    + cart + checkout                                                               UI in builder

B32. AI proxy API                       D41. Cost monitoring                   3. Cart + checkout
    (OpenAI/Anthropic)                      + optimization                         components

B33. Content moderation                 D42. Secrets rotation                  4. AI "Generate Text"
                                                                                  button in editor
B34. Team collaboration                                                        5. Migrate remaining
    (share projects, roles)                                                       blocks to BlockSpec
```

---

## 12. Key Technical Decisions & Constraints

| Decision | Rationale |
|---|---|
| **Static export (`output: "export"`)** | Deployed to GitHub Pages; no server-side rendering. All API calls are client-side fetch. Will migrate to hybrid when backend is ready. |
| **Zustand over Redux** | Simpler API, less boilerplate. Four stores (builder + assets + projects + design) keep concerns separated. |
| **IndexedDB for assets** | No backend yet. Clean migration path: replace `dbPutAsset`/`dbGetBlob` with S3 API calls. |
| **localStorage for projects** | No backend yet. `projectStore.ts` uses localStorage. Same CRUD API shape as future backend — swap `persistProjects()` for fetch calls. |
| **localStorage for analytics** | No backend yet. `lib/analytics.ts` uses localStorage. Replace `persistEvents()`/`loadEvents()` with API calls when backend analytics is ready. |
| **BlockSpec registry pattern** | Extensible: add a new block = 1 spec file + register. No other files change. |
| **Inline styles in JSON** | Components store `ComponentStyles` object, converted to inline CSS on export. Responsive overrides planned via `ResponsiveStyles`. |
| **Design tokens cascade** | `applyDesignTokens()` walks the component tree and applies token-derived styles. Consistent with Figma-style global theming. |
| **@dnd-kit over react-dnd** | Better touch support, accessible, tree-shakeable. |
| **Recharts for analytics** | Lightweight, React-native charting. Already integrated for views/visitors charts. |
| **Razorpay over Stripe** | Primary market is India. Stripe can be added as alternate gateway. |
| **Framer Motion** | Used for page transitions, panel animations, micro-interactions. |
| **`content` → `props` migration** | Legacy blocks use pipe-delimited `content` string. New blocks use typed `props`. Both coexist via `spec.read()` fallback chain. |
| **Freeform + Flow dual canvas** | Flow mode for beginners (stacked layout). Freeform for advanced users (Wix-style absolute positioning). Toggle via `canvasMode`. |
| **Jenkins over GitHub Actions** | Team already using Jenkins for CI/CD. GitHub Actions can be considered as alternative. |
| **AWS over other clouds** | Team using AWS. MongoDB Atlas for database (not DynamoDB) for flexibility with Mongoose ODM. |

---

## 13. File Size Reference (Largest Files)

| File | Size | Notes |
|---|---|---|
| `app/e-commerce/page.tsx` | 96KB | Largest page — full e-commerce showcase |
| `app/globals.css` | 87KB | Master stylesheet (was 83KB) |
| `app/portfolio/page.tsx` | 64KB | Portfolio template page |
| `app/landing/page.tsx` | 62KB | Marketing landing page |
| `app/planning/page.tsx` | 46KB | Pricing plans + invoicing |
| `components/navBar.tsx` | 43KB | Global navigation |
| `app/blog/blog.css` | 39KB | Blog-specific styles |
| `app/signup/page.tsx` | 36KB | Registration page |
| `store/builderStore.ts` | 29KB | Builder state (was 18KB) |
| `app/blog/page.tsx` | 29KB | Blog listing |
| `app/login/page.tsx` | 27KB | Login page |
| `lib/planningInvoiceHtml.ts` | 26KB | Invoice HTML template |
| `app/restaurant/page.tsx` | 22KB | Restaurant template page (NEW) |
| `lib/exportHtml.ts` | 18KB | HTML export engine |
| `components/builder/panel/EffectsTab.tsx` | 18KB | Effects editing panel (NEW) |
| `components/builder/PropertyEditor.tsx` | 18KB | Property editor panel |
| `components/dashboard/CreateProjectModal.tsx` | 17KB | Create project modal (NEW) |
| `types/builder.ts` | 16KB | Builder type definitions (was 9KB) |
| `lib/sectionTemplates.ts` | 15KB | Section templates (NEW) |

---

## 14. Quick Reference: How to Use This Document

### For Frontend Prompts
Use sections: 3 (Directory Structure), 4 (Architecture), 5 (Module Status — focus on ✅/⚠️ items)

### For Backend Team (Node.js + MongoDB)
Use sections: 6 (API Contracts), 7 (Database Models), 8 (Environment Variables), **9 (Detailed Backend Tasks)**, 11 (Roadmap — Backend column)

### For AWS DevOps Team (AWS + Jenkins)
Use sections: 8 (Environment Variables — AWS section), **10 (Detailed AWS DevOps Tasks)**, 11 (Roadmap — DevOps column)

### For Planning/PM Prompts
Use sections: 5 (Module Status Audit), 9-10 (Team Tasks with priorities), 11 (Roadmap), 12 (Technical Decisions)

### For AI Integration Prompts
Use sections: 4.1 (BlockSpec — especially the `ai` field), 6 (AI API endpoints), 11 Phase 4

### For Full Context (Any Model)
Feed the entire document. It's structured to be scannable — models will extract relevant sections.

---

*Updated: 2026-06-16 | Project: Stackly Website Builder | Repo: Ashith-stackly/Website-Builder-Application*
