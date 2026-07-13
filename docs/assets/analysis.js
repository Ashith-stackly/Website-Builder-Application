/* ============================================================================
   Stackly · Codebase Analysis Dashboard  —  data + rendering engine
   ----------------------------------------------------------------------------
   Paths verified against the live source tree on 2026-07-11. Design follows
   ui-ux-pro-max (a11y, SVG icons,
   motion budget, tabular figures) + hallmark (locked tokens, 8 states, honest
   copy, no fake chrome).
   Status: done = shipped & working · partial = exists/not wired · pending = not started
   ========================================================================== */

/* ---- 0. What changed this pass ------------------------------------------ */
const WHATSNEW = {
  title: "Builder Phase 1 completed and management brief added",
  body:
    "Module 4 now includes persisted canvas preferences, a selection toolbar connected to existing builder actions, and a live status bar for save state, block count, viewport, zoom, and grid controls. " +
    "The delivery dashboard now also links to a manager-friendly Word brief covering the project structure, working model, delivery status, and next priorities.",
};

/* ---- 1. Project meta ----------------------------------------------------- */
const PROJECT = {
  name: "Stackly — Website Builder Application",
  tagline: "No-code drag-and-drop website builder (simplified Wix / Squarespace) — now full-stack",
  stack: [
    ["Next.js", "16.1.6 · App Router · output: export"],
    ["React", "19.2.3"],
    ["TypeScript", "^5 (strict)"],
    ["Tailwind CSS", "v4 + globals.css (87 KB)"],
    ["Zustand", "^5 — builder / asset / project / design stores"],
    ["@dnd-kit", "core + sortable — drag & drop"],
    ["Backend", "Node + Express + MongoDB (test/WBA_BACKEND · test/backend)"],
    ["Auth/Infra", "JWT · Passport Google OAuth · Razorpay · AWS S3 (sharp→WebP)"],
    ["Recharts", "^3 — analytics charts"],
    ["next-auth", "^4 (installed; app uses custom JWT + demoAuth)"],
  ],
  entry: [
    ["Frontend root", "app/ (Next.js App Router)"],
    ["State stores", "store/*.ts (Zustand)"],
    ["Builder UI", "components/builder/*"],
    ["Canvas blocks", "components/draggable/* (27 types)"],
    ["Tree Helpers", "lib/treeHelpers.ts · jsonExportImport.ts"],
    ["Manager brief", "docs/manager_project_overview.docx"],
    ["API clients", "lib/api.ts · projectApi · templateApi · blogApi"],
    ["Backend (live)", "test/WBA_BACKEND/ — server.js :5000/api"],
    ["Backend (full)", "test/backend/src/ — 16 models, service layer"],
    ["Consolidation", "implementation_plan.md (Phase 1–2 discovery)"],
  ],
};

/* ---- 2. The 11 modules --------------------------------------------------- */
/* Each module: id, num, name, icon, blurb, tasks[]                            */
/* Each task:   { t: title, s: status, p: [paths], note }                      */

const MODULES = [
  /* ---------------------------------------------------------------- M1 --- */
  {
    id: "m1", num: 1, name: "Authentication & User Management", icon: "🔐",
    blurb: "Now full-stack: the auth UI calls a live Express/MongoDB backend (register, login, OTP, reset, Google OAuth). Remaining gaps are durable session/refresh handling on the client, plan-gating wired to the server, and the subscription lifecycle.",
    tasks: [
      { t: "Setup authentication backend (JWT/session)", s: "done",
        p: ["test/WBA_BACKEND/controllers/authController.js", "test/WBA_BACKEND/middleware/authMiddleware.js", "test/backend/src/services/authService.js", "lib/api.ts"],
        note: "Live backend B issues a 7-day JWT (authController, 1135 lines); backend A adds access+refresh rotation & an Otp model. Client-side refresh-token rotation is the remaining piece." },
      { t: "Create user registration API", s: "done",
        p: ["test/WBA_BACKEND/routes/authRoutes.js", "lib/api.ts", "app/signup/page.tsx"],
        note: "POST /api/auth/register wired end-to-end with server-side validation (domain whitelist, country code, repeated-digit rejection)." },
      { t: "Create login API", s: "done",
        p: ["test/WBA_BACKEND/routes/authRoutes.js", "lib/api.ts", "app/login/page.tsx"],
        note: "POST /api/auth/login (email or mobile + alternate-credential login); token saved to localStorage 'stackly-auth-token'." },
      { t: "Build signup UI", s: "done", p: ["app/signup/page.tsx"],
        note: "36 KB page — name, email, mobile, password, confirm + validation." },
      { t: "Build login UI", s: "done", p: ["app/login/page.tsx", "app/login.css", "lib/demoAuth.ts"],
        note: "Email/mobile + password. New lib/demoAuth.ts adds a fixed tester account with a session-scoped subscription so 'Edit' routes into the builder without a backend." },
      { t: "Password hashing & validation", s: "done",
        p: ["test/WBA_BACKEND/controllers/authController.js", "test/backend/src/models/User.js", "lib/emailValidation.ts", "lib/resetFlowValidation.ts"],
        note: "bcrypt hashing + password-history reuse prevention (last 3) server-side; rich client validators." },
      { t: "Password reset (email/OTP flow)", s: "done",
        p: ["app/forgot-password/page.tsx", "app/verify-email/page.tsx", "app/verify-mobile/page.tsx", "app/create-new-password/page.tsx", "test/WBA_BACKEND/routes/authRoutes.js"],
        note: "Full 4-digit OTP flow (resend timers) → POST /auth/verify-email-otp · /verify-mobile-otp · /reset-password." },
      { t: "OAuth login (Google/GitHub)", s: "partial",
        p: ["components/AuthGoogleButton.tsx", "lib/googleAuth.ts", "test/WBA_BACKEND/config/passport.js", "test/WBA_BACKEND/routes/authRoutes.js"],
        note: "Google is now end-to-end: Passport strategy + GET /auth/google & /google/callback redirect to /google-success?token=. GitHub still not started; callback redirect URLs are hardcoded to localhost." },
      { t: "User profile API (GET/UPDATE)", s: "partial",
        p: ["lib/userSettings.ts", "components/dashboard/ProfileSettingsPanel.tsx", "test/WBA_BACKEND/routes/authRoutes.js", "test/backend/src/routes/userRoutes.js"],
        note: "Backend A exposes GET/PUT /api/user/me; backend B has GET /auth/profile. The frontend still reads/writes profile to localStorage — not yet repointed at the endpoint." },
      { t: "Build profile settings UI", s: "done",
        p: ["app/dashboard/settings/page.tsx", "components/dashboard/ProfileSettingsPanel.tsx"],
        note: "Profile + subscription panels render on the settings page." },
      { t: "Plan tagging (Free/Premium)", s: "partial",
        p: ["test/backend/src/models/User.js", "test/WBA_BACKEND/config/plans.js", "components/dashboard/SubscriptionPanel.tsx"],
        note: "Server models carry plan/subscriptionStatus (backend A: free|basic|business|advanced|premium); the client doesn't yet hydrate authoritative plan state from the server." },
      { t: "Integrate payment gateway (Stripe/Razorpay)", s: "done",
        p: ["test/WBA_BACKEND/controllers/paymentController.js", "test/WBA_BACKEND/utils/verifySignature.js", "lib/razorpayClient.ts"],
        note: "Razorpay create-order + HMAC verify on the backend; Payment model captures card/UPI/wallet. Backend A also stubs Stripe." },
      { t: "Subscription lifecycle (upgrade/downgrade/cancel)", s: "partial",
        p: ["test/backend/src/services/paymentService.js", "test/WBA_BACKEND/models/Subscription.js", "components/dashboard/SubscriptionPanel.tsx"],
        note: "createSubscription + Subscription record + user plan update exist server-side; upgrade/downgrade/cancel + webhook handling and the client wiring are still missing." },
      { t: "Feature access control based on plan", s: "partial",
        p: ["test/backend/src/middleware/requirePlan.js", "test/backend/src/middleware/requirePremium.js"],
        note: "Backend A ships requirePlan / requirePremium gating middleware; not yet applied across routes or mirrored by a client-side gate." },
    ],
  },

  /* ---------------------------------------------------------------- M2 --- */
  {
    id: "m2", num: 2, name: "Workspace & Dashboard", icon: "🗂️",
    blurb: "Effectively complete. The dashboard talks to a live Project API (GET/POST/PUT/DELETE /api/projects on test/WBA_BACKEND) with autosave, duplicate, thumbnail and save-html endpoints all present server-side.",
    tasks: [
      { t: "Design dashboard UI", s: "done",
        p: ["app/dashboard/page.tsx", "app/dashboard/layout.tsx", "components/dashboard/DashboardHeader.tsx", "components/dashboard/StatsCards.tsx"],
        note: "Project listing, stats cards, search + filters." },
      { t: "Create project API (new workspace)", s: "done",
        p: ["test/WBA_BACKEND/routes/projectRoutes.js", "test/WBA_BACKEND/controllers/projectController.js", "lib/projectApi.ts", "store/projectStore.ts"],
        note: "POST /api/projects (auth-protected) live; projectStore maps ProjectApiProject → Project." },
      { t: "Build 'Create Project' flow", s: "done",
        p: ["components/CreateProjectFlow.tsx", "components/dashboard/CreateProjectModal.tsx"],
        note: "4-step wizard: name → category → style → sections." },
      { t: "Fetch and display user projects", s: "done",
        p: ["store/projectStore.ts", "components/dashboard/ProjectGrid.tsx", "components/dashboard/ProjectCard.tsx"],
        note: "loadProjects() → getProjects() GET /projects with connection-error handling." },
      { t: "Delete project feature", s: "done",
        p: ["store/projectStore.ts", "components/dashboard/ProjectCard.tsx"], note: "" },
      { t: "Duplicate project feature", s: "done",
        p: ["store/projectStore.ts", "components/dashboard/ProjectCard.tsx"], note: "" },
      { t: "Project settings page", s: "done",
        p: ["app/dashboard/settings/page.tsx", "components/dashboard/ProjectSettingsForm.tsx"], note: "" },
      { t: "Handle project state persistence", s: "done",
        p: ["test/WBA_BACKEND/routes/projectRoutes.js", "store/builderStore.ts", "lib/projectApi.ts"],
        note: "PUT /:id/autosave + PUT /:id/save-html + PUT /:id/thumbnail persist builderData/HTML server-side; client falls back to localStorage only when the API is unreachable. Note: backend B's GET/PUT/DELETE project routes currently lack auth middleware." },
    ],
  },

  /* ---------------------------------------------------------------- M3 --- */
  {
    id: "m3", num: 3, name: "Template Library", icon: "🎨",
    blurb: "A full templates marketplace page and preview client now exist and clone templates through the backend — a big step past the 'partial' status in the older docs.",
    tasks: [
      { t: "Design template data structure (JSON schema)", s: "done",
        p: ["types/template.ts", "lib/sectionTemplates.ts"], note: "Template + TemplateListItem types; 12 section templates." },
      { t: "Create 3–5 base templates (Portfolio, Blog, Store)", s: "partial",
        p: ["lib/sectionTemplates.ts", "app/portfolio/page.tsx", "app/restaurant/page.tsx", "app/e-commerce/page.tsx"],
        note: "Category copy + showcase pages exist; full seeded template JSON comes from the backend template collection." },
      { t: "Build template listing UI", s: "done",
        p: ["app/templates/page.tsx"], note: "21 KB marketplace grid with category filter + search (getTemplates)." },
      { t: "Template category filter", s: "done",
        p: ["app/templates/page.tsx", "lib/templateApi.ts"], note: "category / search / isPremium query params." },
      { t: "Create template preview page", s: "done",
        p: ["app/templates/preview/page.tsx", "app/templates/preview/TemplatePreviewClient.tsx"], note: "18 KB preview client." },
      { t: "'Use Template' functionality", s: "done",
        p: ["app/templates/page.tsx", "app/templates/preview/TemplatePreviewClient.tsx"],
        note: "cloneTemplate() → POST /templates/:id/clone returns a new projectId." },
      { t: "Clone template into user project", s: "done",
        p: ["lib/templateApi.ts"], note: "cloneTemplate wired; requires auth header." },
      { t: "Store templates in database/storage", s: "done",
        p: ["test/WBA_BACKEND/models/Template.js", "test/WBA_BACKEND/controllers/templateController.js", "test/backend/src/models/Template.js", "test/backend/scripts/seed-templates.js"],
        note: "Backend B: Template model + GET /api/templates + POST /upload (S3 image via sharp→WebP). Backend A: richer Template schema (components, designTokens, premium, price) + a 5-template seed script." },
    ],
  },

  /* ---------------------------------------------------------------- M4 --- */
  {
    id: "m4", num: 4, name: "Drag-and-Drop Builder", icon: "🧩",
    blurb: "Fully complete for the current delivery scope. The @dnd-kit canvas supports flow + freeform modes, 27 block types, nested reordering, undo/redo, selection actions, persisted canvas preferences, responsive viewports, autosave, and JSON import/export.",
    tasks: [
      { t: "Build editor canvas UI", s: "done",
        p: ["components/builder/BuilderLayout.tsx", "components/builder/Canvas.tsx", "components/builder/BuilderStatusBar.tsx", "components/builder/FloatingSelectionToolbar.tsx", "store/builderUiStore.ts"], note: "Canvas with device viewports, CSS zoom, functional grid/dot background, persisted canvas chrome preferences, selected-block actions, and a status bar." },
      { t: "Implement drag-and-drop system", s: "done",
        p: ["components/builder/SortableItem.tsx", "components/builder/CanvasItem.tsx", "components/builder/BuilderLayout.tsx", "lib/treeHelpers.ts"], note: "dnd-kit recursive nested sortable reordering inside containers and cross-container moving." },
      { t: "Text component (add/edit/delete)", s: "done",
        p: ["components/draggable/TextComponent.tsx", "components/draggable/HeadingComponent.tsx", "components/builder/InlineText.tsx"], note: "Click-to-edit inline text." },
      { t: "Image component (upload/select)", s: "done",
        p: ["components/draggable/ImageComponent.tsx", "components/assets/AssetManager.tsx", "components/assets/ImagePicker.tsx"], note: "" },
      { t: "Video component (embed support)", s: "done",
        p: ["components/draggable/VideoComponent.tsx", "components/blocks/video/", "app/video-block/page.tsx"], note: "" },
      { t: "Button component", s: "done",
        p: ["components/draggable/ButtonComponent.tsx", "components/blocks/button/", "app/blockpages/buttonblock/"], note: "" },
      { t: "Component positioning (drag/move)", s: "done",
        p: ["components/builder/FreeformCanvas.tsx", "components/builder/FreeformItem.tsx", "components/builder/SnapGuides.tsx", "components/builder/ResizeHandles.tsx"], note: "Wix-style absolute positioning w/ snap + resize." },
      { t: "Layout system (sections/rows/columns)", s: "done",
        p: ["components/draggable/ColumnsComponent.tsx", "components/draggable/ContainerComponent.tsx", "components/blocks/row/", "components/blocks/columns/"], note: "" },
      { t: "Styling controls (font, color, spacing)", s: "done",
        p: ["components/builder/panel/StyleTab.tsx", "components/builder/panel/controls/"], note: "color, bg, padding, margin, radius, font family/size/weight, align, with resets." },
      { t: "Component settings panel", s: "done",
        p: ["components/builder/PropertyEditor.tsx", "components/builder/panel/EffectsTab.tsx"], note: "Content / Style / Effects / Layers tabs with action resets." },
      { t: "Save page structure as JSON", s: "done",
        p: ["store/builderStore.ts", "lib/projectApi.ts", "lib/jsonExportImport.ts", "components/builder/Canvas.tsx"], note: "autosave/saveHtml to backend + standalone JSON export button to download the schema." },
      { t: "Load saved JSON into editor", s: "done",
        p: ["store/builderStore.ts", "lib/jsonExportImport.ts", "components/builder/Canvas.tsx"], note: "loadComponents() / getProject() from backend + standalone JSON file import with schema validation." },
      { t: "Undo/redo functionality", s: "done",
        p: ["store/builderStore.ts"], note: "50-step history, Ctrl+Z / Ctrl+Shift+Z." },
      { t: "Cloud asset manager (replace IndexedDB)", s: "partial",
        p: ["test/WBA_BACKEND/services/s3Service.js", "test/WBA_BACKEND/middleware/upload.js", "lib/assetDb.ts", "store/assetStore.ts", "components/assets/AssetManager.tsx"],
        note: "Backend now has S3 upload (multer + sharp→WebP) used for blog/template images. The builder's AssetManager still uses IndexedDB — not yet repointed at a generic /api/assets/upload." },
      { t: "Server auto-save (debounced 30s)", s: "done",
        p: ["store/builderStore.ts", "lib/projectApi.ts"], note: "autosave() with AbortController sequencing." },
    ],
  },

  /* ---------------------------------------------------------------- M5 --- */
  {
    id: "m5", num: 5, name: "Preview & Responsive Design", icon: "📱",
    blurb: "Effectively complete. The preview modal renders exported HTML in a sandboxed iframe across desktop / tablet / mobile with zoom controls.",
    tasks: [
      { t: "Build preview renderer (HTML/CSS output)", s: "done",
        p: ["components/builder/PreviewModal.tsx", "lib/exportHtml.ts"], note: "Sandboxed iframe from exportHtml()." },
      { t: "Desktop preview mode", s: "done", p: ["components/builder/PreviewModal.tsx"], note: "1280px frame." },
      { t: "Mobile preview mode", s: "done", p: ["components/builder/PreviewModal.tsx"], note: "390px frame." },
      { t: "Tablet preview mode", s: "done", p: ["components/builder/PreviewModal.tsx"], note: "768px frame." },
      { t: "Implement responsive breakpoints", s: "done",
        p: ["lib/exportHtml.ts", "store/builderStore.ts", "components/builder/panel/StyleTab.tsx", "components/builder/panel/EffectsTab.tsx"],
        note: "Viewport widths (1280/768/390) drive compiled media queries; per-breakpoint style overrides are fully persisted and editable." },
      { t: "Sync editor changes with live preview", s: "done",
        p: ["components/builder/PreviewModal.tsx"], note: "Re-generates HTML from current components on open." },
      { t: "Optimize layout scaling for devices", s: "done",
        p: ["components/builder/ZoomControls.tsx"], note: "25%–200% canvas zoom." },
    ],
  },

  /* ---------------------------------------------------------------- M6 --- */
  {
    id: "m6", num: 6, name: "Domain & Hosting", icon: "🌐",
    blurb: "Backend A now scaffolds the domain layer (Domain model + subdomain/custom-domain/verify service & routes), but nothing is consolidated into the live backend or exposed in the frontend yet. Real DNS/SSL infra remains.",
    tasks: [
      { t: "Generate unique subdomains (username.app.com)", s: "partial",
        p: ["test/backend/src/services/domainService.js", "test/backend/src/models/Domain.js"],
        note: "domainService.setSubdomain() + Domain.subdomain (unique) exist in backend A; not wired to Route 53/edge routing." },
      { t: "Configure DNS/subdomain routing", s: "pending", p: [], note: "Real routing (Route 53 + Lambda@Edge / reverse proxy) not built." },
      { t: "Setup AWS S3 bucket for projects", s: "partial",
        p: ["test/WBA_BACKEND/config/s3.js"], note: "S3 client configured (used for blog/template images); a dedicated stackly-sites bucket for published projects is not set up." },
      { t: "Upload static files to S3", s: "pending", p: [], note: "Tied to the publish pipeline (M7)." },
      { t: "Custom domain input UI", s: "pending",
        p: ["app/dashboard/settings/page.tsx"], note: "Backend has POST /api/domain/custom-domain; no settings-page panel calls it yet." },
      { t: "Domain verification flow (DNS check)", s: "partial",
        p: ["test/backend/src/services/domainService.js", "test/backend/src/routes/domainRoutes.js"],
        note: "GET /api/domain/verify + verifyDomain() scaffolded in backend A; no real DNS propagation check or frontend." },
      { t: "Integrate SSL (AWS ACM/Cloudflare)", s: "pending",
        p: ["test/backend/src/models/Domain.js"], note: "Domain.sslStatus field exists; ACM/Cloudflare automation is infra work not started." },
      { t: "Connect domain to deployed site", s: "pending", p: [], note: "" },
    ],
  },

  /* ---------------------------------------------------------------- M7 --- */
  {
    id: "m7", num: 7, name: "Publishing System", icon: "🚀",
    blurb: "The JSON→HTML compiler is done and the backend now save-htmls per project. Backend A also scaffolds a full deploy/version/rollback service (Deployment model). Still missing: the Publish button + status UI in the builder, real S3 site deploy, and consolidation of the publish service into the live backend.",
    tasks: [
      { t: "Convert JSON layout → static HTML", s: "done",
        p: ["lib/exportHtml.ts", "test/WBA_BACKEND/controllers/projectController.js"], note: "18 KB client compiler; server persists it via PUT /:id/save-html." },
      { t: "Generate CSS from styles", s: "done",
        p: ["lib/exportHtml.ts", "components/draggable/componentStyles.ts"], note: "Inline styles + embedded responsive <style> block." },
      { t: "Bundle assets (images, scripts)", s: "partial",
        p: ["lib/exportHtml.ts", "lib/assetDb.ts"],
        note: "HTML + inline nav JS are bundled; images are still data-URLs from IndexedDB rather than uploaded S3 asset URLs." },
      { t: "Build deployment service (Lambda/API)", s: "partial",
        p: ["test/backend/src/services/publishService.js", "test/backend/src/routes/publishRoutes.js"],
        note: "Backend A: publishService.publish() creates a Deployment + HTML snapshot; POST /api/publish exists but isn't consolidated into the live backend or connected to S3/CloudFront." },
      { t: "Deploy site to S3 bucket", s: "pending",
        p: ["test/WBA_BACKEND/config/s3.js"], note: "S3 client exists for images; publishing a full site to a stackly-sites bucket is not implemented." },
      { t: "Implement 'Publish' button", s: "pending",
        p: ["components/builder/Canvas.tsx", "components/builder/ExportButton.tsx"],
        note: "Only Export/Download exists today; a Publish action calling the publish endpoint is still to be added to the toolbar." },
      { t: "Show deployment status (loading/success/fail)", s: "pending", p: [], note: "Needs a status modal (backend returns Deployment.status)." },
      { t: "Store deployment versions", s: "partial",
        p: ["test/backend/src/models/Deployment.js"],
        note: "Deployment model (version, status, htmlSnapshot, s3Url) + GET /api/publish/deployments scaffolded in backend A; not live or shown in UI." },
      { t: "Implement rollback to previous version", s: "partial",
        p: ["test/backend/src/services/publishService.js"],
        note: "publishService.rollback() + POST /api/publish/rollback scaffolded; no frontend, not consolidated." },
    ],
  },

  /* ---------------------------------------------------------------- M8 --- */
  {
    id: "m8", num: 8, name: "E-commerce (Phase 2)", icon: "🛒",
    blurb: "Big backend jump: Backend A implements the entire commerce layer server-side (Product/Order/Cart/Wishlist models + product CRUD, cart, checkout with Razorpay + inventory). None of it is consolidated into the live backend or surfaced in the builder/storefront UI yet.",
    tasks: [
      { t: "Create product schema (DB)", s: "done",
        p: ["test/backend/src/models/Product.js", "test/backend/scripts/seed-store.js"],
        note: "Product schema (price, images, inventory, salePrice, sku, variants) + a seed-store script creating a demo store with 10 products." },
      { t: "Build product CRUD APIs", s: "partial",
        p: ["test/backend/src/services/ecommerceService.js", "test/backend/src/routes/ecommerceRoutes.js"],
        note: "Full product CRUD (workspace-scoped, slug gen) in backend A; not consolidated into the live backend B or called by the frontend." },
      { t: "Design product management UI", s: "pending", p: ["app/e-commerce/page.tsx"], note: "Showcase only (96 KB); no CRUD panel in the builder sidebar." },
      { t: "Add products to pages", s: "partial",
        p: ["components/draggable/PricingTableComponent.tsx"], note: "Pricing-table block exists; a true product/catalog canvas block does not." },
      { t: "Implement cart system (add/remove/update)", s: "partial",
        p: ["test/backend/src/services/cartService.js", "test/backend/src/models/Cart.js", "test/backend/src/routes/cartRoutes.js"],
        note: "Cart model + getCart/addToCart/updateQuantity/remove/clear service & routes exist server-side; no cart component/block on the canvas." },
      { t: "Build checkout flow", s: "partial",
        p: ["test/backend/src/services/checkoutService.js", "test/backend/src/routes/checkoutRoutes.js"],
        note: "checkoutService (cart→order, Razorpay order, inventory deduction, HMAC verify) in backend A; no checkout UI." },
      { t: "Integrate payment gateway", s: "partial",
        p: ["test/backend/src/services/checkoutService.js", "lib/razorpayClient.ts"], note: "Razorpay wired for both subscriptions and (server-side) product checkout; product checkout not surfaced client-side." },
      { t: "Store order details", s: "partial",
        p: ["test/backend/src/models/Order.js"], note: "Order model (items, totals, razorpay fields, shipping/billing) exists; no client flow writes to it yet." },
      { t: "Create order management dashboard", s: "pending", p: [], note: "No merchant order dashboard UI." },
    ],
  },

  /* ---------------------------------------------------------------- M9 --- */
  {
    id: "m9", num: 9, name: "Blog & SEO", icon: "✍️",
    blurb: "The blog UI and workspace-scoped backend services are implemented. Before this module can be called fully live, the frontend blog API contract must be aligned with the active backend routes and workspace context. Open Graph tags are set client-side today; crawler-ready static/server metadata remains a follow-up.",
    tasks: [
      { t: "Create blog post schema", s: "done",
        p: ["test/WBA_BACKEND/models/Blog.js", "types/blog.ts", "lib/blogApi.ts"], note: "Server Blog model (SEO + OG + Twitter + canonical fields) + client types." },
      { t: "Build blog editor UI", s: "done",
        p: ["components/blog/BlogForm.tsx", "app/blog/manage/create/page.tsx", "app/blog/manage/edit/[slug]/page.tsx", "app/blog/manage/page.tsx"],
        note: "Create page refactored onto a shared BlogForm component (commit 88c6b50); manage list + edit screens." },
      { t: "Implement post creation/edit/delete", s: "done",
        p: ["test/WBA_BACKEND/routes/blogRoutes.js", "test/WBA_BACKEND/controllers/blogController.js", "lib/blogApi.ts"],
        note: "POST /create (multer image), GET, GET /:slug, PUT /:id, PATCH /:id/publish, DELETE /:id — all live." },
      { t: "Generate slug-based URLs", s: "done",
        p: ["app/blog/[slug]/page.tsx", "test/WBA_BACKEND/controllers/blogController.js"], note: "Dynamic [slug] routes; slug generated server-side (slugify)." },
      { t: "Add SEO metadata fields (title, description)", s: "done",
        p: ["components/builder/SEOPanel.tsx", "store/designStore.ts", "test/WBA_BACKEND/models/Blog.js"], note: "SEOMetadata in designStore; Blog model persists seoTitle/description/keywords." },
      { t: "Generate sitemap.xml", s: "done",
        p: ["test/WBA_BACKEND/utils/generateSitemap.js", "test/WBA_BACKEND/routes/sitemapRoutes.js"],
        note: "GET /sitemap.xml builds an XML sitemap from published blogs; regenerated on blog create/update/publish." },
      { t: "Add Open Graph/meta tags", s: "partial",
        p: ["test/WBA_BACKEND/models/Blog.js", "components/builder/SEOPanel.tsx", "lib/exportHtml.ts"],
        note: "Blog model stores ogTitle/ogDescription/ogImage/ogType/twitterCard/canonicalUrl; per-page OG injection into exported builder HTML is still to be finished." },
      { t: "Implement blog listing page", s: "done",
        p: ["app/blog/page.tsx", "app/blog/blog.css", "components/blog/BlogHeader.tsx"], note: "29 KB listing + 39 KB styles." },
    ],
  },

  /* ---------------------------------------------------------------- M10 -- */
  {
    id: "m10", num: 10, name: "Analytics Dashboard", icon: "📊",
    blurb: "The dashboard UI is complete (KPI cards, Recharts charts, top pages, activity). Backend A now scaffolds event ingestion + aggregation (AnalyticsEvent model, trackEvent/getDashboard). The client still runs on localStorage demo data and the analytics backend isn't consolidated into the live server.",
    tasks: [
      { t: "Track page views (basic tracking script)", s: "partial",
        p: ["lib/analytics.ts", "test/backend/src/services/analyticsService.js"],
        note: "trackPageView() writes to localStorage; backend A has POST /api/analytics/track but no on-site pixel is injected into published pages yet." },
      { t: "Store analytics data", s: "partial",
        p: ["test/backend/src/models/AnalyticsEvent.js", "lib/analytics.ts", "types/analytics.ts"],
        note: "AnalyticsEvent model (eventType, path, sessionId, indexes) exists server-side; client still stores last 10k events in localStorage." },
      { t: "Build analytics dashboard UI", s: "done",
        p: ["app/dashboard/analytics/page.tsx", "components/analytics/AnalyticsCards.tsx"], note: "" },
      { t: "Display traffic metrics (views, visitors)", s: "done",
        p: ["components/analytics/AnalyticsCards.tsx", "components/analytics/TopPages.tsx", "components/analytics/ActivityTable.tsx"], note: "" },
      { t: "Add charts (daily/weekly stats)", s: "done",
        p: ["components/analytics/ViewsChart.tsx", "components/analytics/VisitorsChart.tsx"], note: "Recharts line charts + today/7d/30d filter." },
      { t: "Integrate Google Analytics (optional)", s: "pending", p: [], note: "Not started." },
      { t: "Server-side event ingestion & aggregation", s: "partial",
        p: ["test/backend/src/services/analyticsService.js", "test/backend/src/routes/analyticsRoutes.js"],
        note: "Backend A: trackEvent + getDashboard aggregation + POST /track & GET /dashboard. Not consolidated into the live backend and the client dashboard isn't repointed at it yet." },
    ],
  },

  /* ---------------------------------------------------------------- M11 -- */
  {
    id: "m11", num: 11, name: "AI Content Assistant", icon: "🤖",
    blurb: "Not started. Block specs carry AI hint fields (description + exampleOutput), but nothing is wired to an LLM. No Generate-Text/Image buttons or layout suggester exist.",
    tasks: [
      { t: "Integrate AI text generation API", s: "pending", p: ["lib/blockRegistry.ts"], note: "BlockSpec.ai hints exist but no /api/ai/generate-text call." },
      { t: "Add 'Generate Text' button in editor", s: "pending", p: ["components/builder/PropertyEditor.tsx"], note: "To live in content fields." },
      { t: "Generate content for sections (hero, about…)", s: "pending", p: [], note: "" },
      { t: "Integrate AI image generation API", s: "pending", p: [], note: "/api/ai/generate-image." },
      { t: "Add image placeholder generator", s: "pending", p: ["components/assets/AssetManager.tsx"], note: "" },
      { t: "Suggest layouts based on content type", s: "pending", p: [], note: "/api/ai/suggest-layout." },
    ],
  },
];

/* ---- 3. Presentation data (icons · backends · API surface) --------------- */

const MOD_ICON = {
  m1: "i-lock", m2: "i-dashboard", m3: "i-template", m4: "i-grid",
  m5: "i-smartphone", m6: "i-globe", m7: "i-rocket", m8: "i-cart",
  m9: "i-pen", m10: "i-chart", m11: "i-sparkles",
};

const BACKENDS = [
  { cls: "be-live", tag: "Live", name: "Backend B — WBA_BACKEND", path: "test/WBA_BACKEND/",
    desc: "What the frontend actually calls at <b>:5000/api</b>: auth (+ Google OAuth), projects (autosave / save-html / duplicate), blog CMS (S3 images + sitemap), templates, payments, categories. Flat MVC on Express 5." },
  { cls: "be-full", tag: "Scaffold", name: "Backend A — test/backend", path: "test/backend/src/",
    desc: "A comprehensive service-layer backend — <b>16 models</b> covering every module incl. e-commerce, domain, publish, analytics and plan-gating. Not yet consolidated or deployed (see implementation_plan.md)." },
];

/* Backend endpoint surface per module. be: 'live' (Backend B) | 'full' (Backend A). */
const MOD_APIS = {
  m1: [
    { m: "POST", path: "/api/auth/register", be: "live" },
    { m: "POST", path: "/api/auth/login", be: "live" },
    { m: "POST", path: "/api/auth/forgot-password", be: "live" },
    { m: "POST", path: "/api/auth/verify-email-otp", be: "live" },
    { m: "POST", path: "/api/auth/verify-mobile-otp", be: "live" },
    { m: "POST", path: "/api/auth/reset-password", be: "live" },
    { m: "GET", path: "/api/auth/profile", be: "live" },
    { m: "GET", path: "/api/auth/google · /google/callback", be: "live" },
    { m: "GET", path: "/api/user/me", be: "full" },
    { m: "PUT", path: "/api/user/me", be: "full" },
    { m: "POST", path: "/api/auth/refresh-token", be: "full" },
  ],
  m2: [
    { m: "GET", path: "/api/projects", be: "live" },
    { m: "POST", path: "/api/projects", be: "live" },
    { m: "GET", path: "/api/projects/:id", be: "live" },
    { m: "PUT", path: "/api/projects/:id", be: "live" },
    { m: "DELETE", path: "/api/projects/:id", be: "live" },
    { m: "PUT", path: "/api/projects/:id/autosave", be: "live" },
    { m: "POST", path: "/api/projects/:id/duplicate", be: "live" },
    { m: "PUT", path: "/api/projects/:id/save-html", be: "live" },
    { m: "PUT", path: "/api/projects/:id/thumbnail", be: "live" },
  ],
  m3: [
    { m: "GET", path: "/api/templates", be: "live" },
    { m: "POST", path: "/api/templates/upload", be: "live" },
    { m: "GET", path: "/api/categories", be: "live" },
    { m: "POST", path: "/api/templates/:id/use-template", be: "full" },
  ],
  m4: [
    { m: "PUT", path: "/api/projects/:id/autosave", be: "live" },
    { m: "POST", path: "/api/blogs/create (multer → S3 image)", be: "live" },
    { m: "POST", path: "/api/assets/upload (planned)", be: "full" },
  ],
  m5: [],
  m6: [
    { m: "POST", path: "/api/domain/subdomain", be: "full" },
    { m: "POST", path: "/api/domain/custom-domain", be: "full" },
    { m: "GET", path: "/api/domain/verify", be: "full" },
  ],
  m7: [
    { m: "PUT", path: "/api/projects/:id/save-html", be: "live" },
    { m: "POST", path: "/api/publish", be: "full" },
    { m: "GET", path: "/api/publish/deployments", be: "full" },
    { m: "POST", path: "/api/publish/rollback", be: "full" },
  ],
  m8: [
    { m: "GET", path: "/api/ecommerce (products)", be: "full" },
    { m: "POST", path: "/api/ecommerce", be: "full" },
    { m: "PUT", path: "/api/ecommerce/:id", be: "full" },
    { m: "DELETE", path: "/api/ecommerce/:id", be: "full" },
    { m: "GET", path: "/api/cart", be: "full" },
    { m: "POST", path: "/api/checkout/create-order", be: "full" },
    { m: "POST", path: "/api/checkout/verify-payment", be: "full" },
  ],
  m9: [
    { m: "POST", path: "/api/blogs/create", be: "live" },
    { m: "GET", path: "/api/blogs", be: "live" },
    { m: "GET", path: "/api/blogs/:slug", be: "live" },
    { m: "PUT", path: "/api/blogs/:id", be: "live" },
    { m: "PATCH", path: "/api/blogs/:id/publish", be: "live" },
    { m: "DELETE", path: "/api/blogs/:id", be: "live" },
    { m: "GET", path: "/sitemap.xml", be: "live" },
  ],
  m10: [
    { m: "POST", path: "/api/analytics/track", be: "full" },
    { m: "GET", path: "/api/analytics/dashboard", be: "full" },
  ],
  m11: [],
};

/* ---- 4. Rendering engine ------------------------------------------------- */

const RM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = { filter: "all", query: "" };

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ico = (id, cls) => `<svg class="ico${cls ? " " + cls : ""}" aria-hidden="true"><use href="#${id}"/></svg>`;

function countTasks(mod) {
  const c = { done: 0, partial: 0, pending: 0, total: mod.tasks.length };
  mod.tasks.forEach((t) => (c[t.s] += 1));
  return c;
}
const modProgress = (c) => Math.round(((c.done + c.partial * 0.5) / c.total) * 100);

function grandTotals() {
  const t = { done: 0, partial: 0, pending: 0, total: 0 };
  MODULES.forEach((m) => { const c = countTasks(m); t.done += c.done; t.partial += c.partial; t.pending += c.pending; t.total += c.total; });
  return t;
}

/* ---- 4a. Hero + KPIs ----------------------------------------------------- */
function renderTotals() {
  const t = grandTotals();
  const pct = Math.round(((t.done + t.partial * 0.5) / t.total) * 100);
  const pctPrev = 60; // last audit, before the backend landed

  document.getElementById("kpiRow").innerHTML =
    kpiCard("overall", "Overall completion", pct, "%", `${t.total} tasks · 11 modules`) +
    kpiCard("done", "Done", t.done, "", "shipped & working") +
    kpiCard("partial", "Partial", t.partial, "", "exists · needs wiring") +
    kpiCard("pending", "Pending", t.pending, "", "not started");

  document.getElementById("overallBar").innerHTML = `
    <div class="stack-bar" role="img" aria-label="${t.done} done, ${t.partial} partial, ${t.pending} pending">
      <span class="seg st-done"    data-w="${(t.done / t.total) * 100}"></span>
      <span class="seg st-partial" data-w="${(t.partial / t.total) * 100}"></span>
      <span class="seg st-pending" data-w="${(t.pending / t.total) * 100}"></span>
    </div>`;

  document.getElementById("overallLegend").innerHTML = `
    <span><i class="st-done"></i> ${t.done} done</span>
    <span><i class="st-partial"></i> ${t.partial} partial</span>
    <span><i class="st-pending"></i> ${t.pending} pending</span>`;

  const delta = pct - pctPrev;
  document.getElementById("deltaPill").innerHTML =
    `${ico("i-arrow-up")} ${delta >= 0 ? "+" : ""}${delta} pts since last audit`;

  // filter counts
  document.querySelectorAll(".fcount").forEach((el) => {
    const k = el.dataset.count;
    el.textContent = k === "all" ? t.total : t[k];
  });
}

function kpiCard(kind, label, value, suffix, sub) {
  return `
    <div class="col-6 col-lg-3">
      <div class="kpi k-${kind}">
        <div class="kpi-value"><span class="tnum" data-count-to="${value}">0</span>${suffix ? `<span class="suf">${suffix}</span>` : ""}</div>
        <div class="kpi-label">${label}</div>
        <div class="kpi-sub">${sub}</div>
      </div>
    </div>`;
}

/* ---- 4b. Meta panels + backend map -------------------------------------- */
function renderMeta() {
  document.getElementById("stackList").innerHTML = PROJECT.stack
    .map(([k, v]) => `<li><span class="meta-k">${esc(k)}</span><span class="meta-v">${esc(v)}</span></li>`).join("");
  document.getElementById("entryList").innerHTML = PROJECT.entry
    .map(([k, v]) => `<li><span class="meta-k">${esc(k)}</span><span class="meta-v"><code>${esc(v)}</code></span></li>`).join("");
  document.getElementById("backendMap").innerHTML = BACKENDS.map((b) => `
    <div class="be-card ${b.cls}">
      <div class="be-top">
        <span class="be-dot"></span>
        <span class="be-name">${b.name}</span>
        <span class="be-tag">${b.tag}</span>
      </div>
      <div class="be-path">${b.path}</div>
      <p class="be-desc">${b.desc}</p>
    </div>`).join("");
}

/* ---- 4c. Sidebar nav ----------------------------------------------------- */
function renderNav() {
  document.getElementById("moduleNav").innerHTML = MODULES.map((m) => {
    const pct = modProgress(countTasks(m));
    return `
      <a class="nav-link" href="#${m.id}" data-mod="${m.id}">
        ${ico(MOD_ICON[m.id])}
        <span class="nav-txt">M${m.num} · ${m.name}</span>
        <span class="nav-pct tnum">${pct}%</span>
      </a>`;
  }).join("");
}

/* ---- 4d. Module cards ---------------------------------------------------- */
function renderModules() {
  document.getElementById("modules").innerHTML = MODULES.map(renderModuleCard).join("");
  applyFilters();
}

function renderModuleCard(m) {
  const c = countTasks(m);
  const pct = modProgress(c);
  const rows = m.tasks.map(renderTaskRow).join("");
  const apis = MOD_APIS[m.id] || [];
  const apiBlock = apis.length
    ? `<details class="apis">
         <summary>${ico("i-server")} Backend endpoints <span class="tnum" style="opacity:.6">(${apis.length})</span><span class="chev">›</span></summary>
         <div class="api-list">${apis.map(renderApiRow).join("")}</div>
       </details>`
    : `<div class="apis"><div class="api-row"><span style="color:var(--text-faint);font-size:12px;padding:2px 0">Client-only module — no backend endpoints.</span></div></div>`;

  return `
  <section class="module-card" id="${m.id}" data-mod="${m.id}">
    <header class="module-head">
      <div class="module-title">
        <span class="module-ico">${ico(MOD_ICON[m.id])}</span>
        <div>
          <div class="module-kick">Module ${m.num}</div>
          <h2>${m.name}</h2>
          <p class="module-blurb">${m.blurb}</p>
        </div>
      </div>
      <div class="module-meter">
        <div class="ring-wrap" role="img" aria-label="${pct}% complete">
          <svg viewBox="0 0 36 36"><circle class="ring-track" cx="18" cy="18" r="15.915"/><circle class="ring-fill st-${topStatus(c)}" cx="18" cy="18" r="15.915" data-pct="${pct}"/></svg>
          <span class="ring-num tnum">${pct}%</span>
        </div>
        <div class="chips">
          <span class="chip st-done">${c.done} done</span>
          <span class="chip st-partial">${c.partial} partial</span>
          <span class="chip st-pending">${c.pending} pending</span>
        </div>
      </div>
    </header>
    <div class="stack-bar slim" role="img" aria-label="${c.done} done, ${c.partial} partial, ${c.pending} pending">
      <span class="seg st-done"    data-w="${(c.done / c.total) * 100}"></span>
      <span class="seg st-partial" data-w="${(c.partial / c.total) * 100}"></span>
      <span class="seg st-pending" data-w="${(c.pending / c.total) * 100}"></span>
    </div>
    ${apiBlock}
    <div class="table-wrap">
      <table class="task-table">
        <thead><tr><th></th><th>Sprint task</th><th>Status</th><th>Path examples &amp; notes</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}

function topStatus(c) {
  if (c.pending > c.done && c.pending > c.partial) return "pending";
  if (c.partial >= c.done && c.partial > 0 && c.done < c.total) return "partial";
  return "done";
}

function renderApiRow(a) {
  const mCls = "m-" + a.m.split(/[ /]/)[0];
  const beCls = a.be === "live" ? "live" : "full";
  const beLbl = a.be === "live" ? "Live" : "Scaffold";
  return `<div class="api-row">
    <span class="api-m ${mCls}">${a.m}</span>
    <span class="api-path">${esc(a.path)}</span>
    <span class="api-be ${beCls}">${beLbl}</span>
  </div>`;
}

function renderTaskRow(task) {
  const paths = task.p.length
    ? `<div class="paths">${task.p.map((p) =>
        `<button type="button" class="path" data-copy="${esc(p)}" title="Copy path">${esc(p)}${ico("i-copy", "copy-ico")}</button>`).join("")}</div>`
    : `<div class="paths"><span class="path-none">— no file yet —</span></div>`;
  const note = task.note ? `<p class="note">${esc(task.note)}</p>` : "";
  const hay = (task.t + " " + (task.note || "") + " " + task.p.join(" ")).toLowerCase().replace(/"/g, "");
  const label = task.s.charAt(0).toUpperCase() + task.s.slice(1);
  return `
    <tr class="task-row" data-status="${task.s}" data-search="${esc(hay)}">
      <td class="cell-dot"><span class="tdot st-${task.s}"></span></td>
      <td class="cell-task">${task.t}</td>
      <td class="cell-status"><span class="badge st-${task.s}">${label}</span></td>
      <td class="cell-paths">${paths}${note}</td>
    </tr>`;
}

/* ---- 4e. Filtering ------------------------------------------------------- */
function applyFilters() {
  let shown = 0, totalTasks = 0;
  const q = state.query.trim().toLowerCase();
  document.querySelectorAll(".module-card").forEach((card) => {
    let anyVisible = false;
    card.querySelectorAll(".task-row").forEach((row) => {
      totalTasks++;
      const passFilter = state.filter === "all" || row.dataset.status === state.filter;
      const passQuery = !q || row.dataset.search.includes(q);
      const visible = passFilter && passQuery;
      row.style.display = visible ? "" : "none";
      if (visible) { anyVisible = true; shown++; }
    });
    card.style.display = anyVisible ? "" : "none";
  });
  const empty = document.getElementById("emptyState");
  if (empty) empty.hidden = shown !== 0;
  const sc = document.getElementById("searchCount");
  if (sc) sc.textContent = (state.filter !== "all" || q) ? `${shown} of ${totalTasks} tasks` : "";
}

/* ---- 4f. Interactions ---------------------------------------------------- */
function animateNumbers(scope) {
  scope.querySelectorAll("[data-count-to]").forEach((el) => {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    const to = parseFloat(el.dataset.countTo);
    if (RM) { el.textContent = to; return; }
    const dur = 850, start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function revealScope(el) {
  el.classList.add("in");
  el.querySelectorAll(".seg[data-w]").forEach((s) => { s.style.width = s.dataset.w + "%"; });
  el.querySelectorAll(".ring-fill[data-pct]").forEach((r) => { r.style.strokeDasharray = `${RM ? r.dataset.pct : r.dataset.pct} 100`; });
  animateNumbers(el);
}

function wireControls() {
  const search = document.getElementById("searchInput");
  const sidebar = document.getElementById("sidebar");
  const navToggle = document.getElementById("navToggle");
  const themeToggle = document.getElementById("themeToggle");
  const live = document.getElementById("liveRegion");

  // filters
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((b) => {
        const on = b === btn; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on));
      });
      applyFilters();
    });
  });

  // search
  search.addEventListener("input", () => { state.query = search.value; applyFilters(); });
  document.getElementById("clearFilters").addEventListener("click", () => {
    state.query = ""; state.filter = "all"; search.value = "";
    document.querySelectorAll("[data-filter]").forEach((b) => {
      const on = b.dataset.filter === "all"; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on));
    });
    applyFilters(); search.focus();
  });

  // copy-to-clipboard on paths (silent success + brief confirm)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".path[data-copy]");
    if (!btn) return;
    const text = btn.dataset.copy;
    const done = () => {
      btn.classList.add("copied");
      const use = btn.querySelector("use"); if (use) use.setAttribute("href", "#i-check");
      if (live) live.textContent = "Copied " + text;
      clearTimeout(btn._t);
      btn._t = setTimeout(() => { btn.classList.remove("copied"); if (use) use.setAttribute("href", "#i-copy"); }, 1200);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(() => {});
    else done();
  });

  // scroll-spy
  const links = [...document.querySelectorAll("#moduleNav .nav-link")];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.dataset.mod === en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
  document.querySelectorAll(".module-card").forEach((c) => spy.observe(c));

  // reveal-on-scroll (+ ring/bar/number animation)
  const revObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { revealScope(en.target); revObs.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal, .module-card").forEach((el) => revObs.observe(el));
  // Fallback: reveal anything already in view / above the fold immediately.
  requestAnimationFrame(() => document.querySelectorAll(".reveal, .module-card").forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) revealScope(el);
  }));

  // mobile sidebar
  if (navToggle && sidebar) {
    const setOpen = (open) => { sidebar.classList.toggle("open", open); navToggle.setAttribute("aria-expanded", String(open)); };
    navToggle.addEventListener("click", () => setOpen(!sidebar.classList.contains("open")));
    sidebar.addEventListener("click", (e) => { if (e.target.closest(".nav-link")) setOpen(false); });
  }

  // theme
  const root = document.documentElement;
  const applyTheme = (t) => { root.setAttribute("data-theme", t); themeToggle.setAttribute("aria-pressed", String(t === "dark")); try { localStorage.setItem("stackly-docs-theme", t); } catch (_) {} };
  let saved = null; try { saved = localStorage.getItem("stackly-docs-theme"); } catch (_) {}
  applyTheme(saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeToggle.addEventListener("click", () => applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));

  // back to top
  const fab = document.getElementById("backToTop");
  const onScroll = () => { const show = window.scrollY > 520; fab.hidden = false; fab.classList.toggle("show", show); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  fab.addEventListener("click", () => window.scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" }));

  // keyboard: "/" focus search · "t" theme · Esc clear
  document.addEventListener("keydown", (e) => {
    const typing = /^(input|textarea|select)$/i.test(e.target.tagName);
    if (e.key === "/" && !typing) { e.preventDefault(); search.focus(); search.select(); }
    else if ((e.key === "t" || e.key === "T") && !typing) { themeToggle.click(); }
    else if (e.key === "Escape" && e.target === search) { search.value = ""; state.query = ""; applyFilters(); search.blur(); }
  });
}

/* ---- 5. Boot ------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("projName").textContent = "Stackly";
  document.getElementById("projTagline").textContent = PROJECT.tagline;
  document.getElementById("genDate").textContent = "Re-audited 2026-07-11 · Builder Phase 1 Complete";
  const wn = document.getElementById("whatsNew");
  if (wn) wn.innerHTML = `<span class="wn-badge">NEW</span><div class="wn-body"><h3>${WHATSNEW.title}</h3><p>${WHATSNEW.body}</p></div>`;
  renderMeta();
  renderNav();
  renderTotals();
  renderModules();
  wireControls();
});
