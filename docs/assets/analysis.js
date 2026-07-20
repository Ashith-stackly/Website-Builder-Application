/* ============================================================================
   Stackly codebase analysis dashboard
   Source-and-contract audit: 20 July 2026

   Status meanings:
   - done: the requested capability is implemented in the source tree.
   - partial: source exists, but the user flow has a missing, broken, local-only,
     mock-only, or deployment-dependent integration.
   - pending: no implementation was found for the requested capability.
   ========================================================================== */

const AUDIT_DATE = "20 Jul 2026";

const WHATSNEW = {
  title: "Builder, commerce, analytics, and AI modules reconciled",
  body:
    "This pass updates the dashboard after the Module 4 freeform builder work, the Module 8 storefront checkout work, the Module 10 analytics tracker/dashboard work, and the Module 11 AI assistant. " +
    "The main remaining source gaps are templates, hosted publishing, domains/SSL, Google Analytics as an optional integration, and a few local-only settings flows."
};

const PROJECT = {
  tagline: "No-code drag-and-drop website builder with a Next.js frontend and a unified Express/MongoDB backend.",
  stack: [
    ["Next.js", "16.1.6 · App Router · static export"],
    ["React", "19.2.3"],
    ["TypeScript", "strict mode"],
    ["Tailwind CSS", "v4"],
    ["State", "Zustand stores"],
    ["Builder", "@dnd-kit flow editor + opt-in freeform canvas"],
    ["Backend", "Node.js · Express · MongoDB/Mongoose"],
    ["Auth & billing", "JWT · Google OAuth code exchange · Stripe/Razorpay services"],
    ["Analytics", "MongoDB event aggregation + dashboard"],
  ],
  entry: [
    ["Frontend", "frontend/app/"],
    ["Builder", "frontend/components/builder/"],
    ["State", "frontend/store/"],
    ["API clients", "frontend/lib/"],
    ["Backend app", "backend/src/app.js"],
    ["Backend routes", "backend/src/routes/"],
    ["Backend services", "backend/src/services/"],
    ["Documentation", "docs/index.html"],
  ],
};

const MODULES = [
  {
    id: "m1", num: 1, name: "Authentication & User Management",
    blurb: "The core JWT, registration, login, password-reset, profile, and plan data layers exist. OAuth is Google-only, while profile, billing, and feature-gating surfaces are not fully connected to the active APIs.",
    tasks: [
      { t: "Setup authentication backend (JWT/session)", s: "done",
        p: ["backend/src/services/authService.js", "backend/src/utils/jwt.js"],
        note: "The active backend issues access and refresh JWTs through register/login/refresh endpoints." },
      { t: "Create user registration API", s: "done",
        p: ["backend/src/routes/authRoutes.js", "backend/src/validators/authValidation.js"],
        note: "POST /api/auth/register validates input, creates the user, and issues verification OTP delivery." },
      { t: "Create login API", s: "done",
        p: ["backend/src/routes/authRoutes.js", "frontend/lib/api.ts"],
        note: "POST /api/auth/login is implemented and the client stores the returned access token." },
      { t: "Build signup UI", s: "done",
        p: ["frontend/app/signup/page.tsx"],
        note: "Signup form and client-side validation are implemented." },
      { t: "Build login UI", s: "done",
        p: ["frontend/app/login/page.tsx", "frontend/app/login.css"],
        note: "Email/mobile login UI is implemented." },
      { t: "Implement password hashing & validation", s: "done",
        p: ["backend/src/models/User.js", "backend/src/validators/authValidation.js"],
        note: "User passwords are bcrypt-hashed before save and registration/reset inputs are validated." },
      { t: "Implement password reset (email flow)", s: "done",
        p: ["backend/src/services/authService.js", "frontend/app/forgot-password/page.tsx", "frontend/app/create-new-password/page.tsx"],
        note: "Email/mobile OTP verification and reset-token flow are present end to end in source." },
      { t: "Add OAuth login (Google/GitHub)", s: "partial",
        p: ["frontend/lib/googleAuth.ts", "backend/src/services/authService.js", "backend/src/config/passport.js"],
        note: "Google authorization-code exchange exists; GitHub is absent, and the returned OAuth tokens are not persistently consumed by a dedicated client callback." },
      { t: "Create user profile API (GET/UPDATE)", s: "done",
        p: ["backend/src/routes/userRoutes.js", "backend/src/services/userService.js"],
        note: "Authenticated GET/PUT /api/user/profile routes are active in the unified backend." },
      { t: "Build profile settings UI", s: "partial",
        p: ["frontend/components/dashboard/ProfileSettingsPanel.tsx", "frontend/lib/userSettings.ts"],
        note: "The settings form exists, but it reads and writes browser localStorage instead of /api/user/profile." },
      { t: "Implement plan tagging (Free/Premium)", s: "partial",
        p: ["backend/src/models/User.js", "backend/src/constants/plans.js"],
        note: "The User model and project-limit logic carry plan state, but the settings UI does not hydrate authoritative plan data from the backend." },
      { t: "Integrate payment gateway (Stripe/Razorpay)", s: "partial",
        p: ["backend/src/services/paymentService.js", "frontend/lib/razorpayClient.ts"],
        note: "Server-side Stripe/Razorpay services exist; the planning UI currently uses a separate local/demo Razorpay helper instead of the main backend flow." },
      { t: "Handle subscription lifecycle (upgrade/downgrade/cancel)", s: "partial",
        p: ["backend/src/routes/paymentRoutes.js", "backend/src/services/paymentService.js"],
        note: "Checkout, subscription lookup, and cancellation endpoints exist; upgrades/downgrades, webhooks, and settings-page integration remain incomplete." },
      { t: "Implement feature access control based on plan", s: "partial",
        p: ["backend/src/middleware/requirePlan.js", "backend/src/services/projectService.js"],
        note: "Generic plan middleware exists and project-count limits are enforced, but paid-feature middleware is not applied across protected features or mirrored in the client." },
    ],
  },
  {
    id: "m2", num: 2, name: "Workspace & Dashboard",
    blurb: "The authenticated project dashboard, CRUD API, duplicate flow, and builder autosave are implemented. The project settings form still only updates Zustand state locally.",
    tasks: [
      { t: "Design dashboard UI", s: "done",
        p: ["frontend/app/dashboard/page.tsx", "frontend/components/dashboard/ProjectGrid.tsx"],
        note: "Dashboard cards, recent projects, filtering, and loading/error states are implemented." },
      { t: "Create project API (new workspace)", s: "done",
        p: ["backend/src/routes/projectRoutes.js", "backend/src/services/projectService.js"],
        note: "Authenticated GET/POST/GET one/PUT/DELETE project routes are mounted at /api/projects." },
      { t: "Build Create Project flow", s: "done",
        p: ["frontend/components/dashboard/CreateProjectModal.tsx", "frontend/lib/projectApi.ts"],
        note: "The dashboard modal creates a project through POST /api/projects and opens the builder." },
      { t: "Fetch and display user projects", s: "done",
        p: ["frontend/store/projectStore.ts", "frontend/lib/projectApi.ts"],
        note: "The project store loads the authenticated project list from the backend." },
      { t: "Implement delete project feature", s: "done",
        p: ["frontend/store/projectStore.ts", "backend/src/services/projectService.js"],
        note: "The UI calls DELETE /api/projects/:id with optimistic recovery on failure." },
      { t: "Implement duplicate project feature", s: "done",
        p: ["frontend/store/projectStore.ts"],
        note: "Duplicate is a client-composed get → create → autosave flow; it is not a dedicated /api/projects duplicate endpoint." },
      { t: "Add project settings page", s: "partial",
        p: ["frontend/components/dashboard/ProjectSettingsForm.tsx"],
        note: "The settings screen exists, but its save action mutates local Zustand state rather than PUT /api/projects/:id." },
      { t: "Handle project state persistence", s: "done",
        p: ["frontend/store/builderStore.ts", "backend/src/routes/projectRoutes.js"],
        note: "Builder data and generated HTML are persisted through autosave and save-html routes." },
    ],
  },
  {
    id: "m3", num: 3, name: "Template Library",
    blurb: "The database model, five seed records, listing UI, and backend use-template flow exist, but the current template client and backend disagree on paths, field names, categories, and clone response shapes.",
    tasks: [
      { t: "Design template data structure (JSON schema)", s: "partial",
        p: ["backend/src/models/Template.js", "frontend/types/template.ts"],
        note: "Both sides define template shapes, but the backend exposes premium/components/designTokens while the frontend expects isPremium/builderData." },
      { t: "Create 3–5 base templates (Portfolio, Blog, Store)", s: "partial",
        p: ["backend/src/services/templateService.js", "backend/scripts/seed-templates.js"],
        note: "Five seed records exist, including store, portfolio, and blog, but their components arrays are empty rather than complete builder layouts." },
      { t: "Build template listing UI", s: "done",
        p: ["frontend/app/templates/page.tsx"],
        note: "A searchable, categorized template marketplace UI and local fallback cards are implemented." },
      { t: "Implement template category filter", s: "done",
        p: ["frontend/app/templates/page.tsx", "frontend/types/template.ts"],
        note: "Category and search controls are present in the UI; backend category values still need normalization." },
      { t: "Create template preview page", s: "partial",
        p: ["frontend/app/templates/preview/TemplatePreviewClient.tsx"],
        note: "The preview page exists, but the current backend contract cannot supply the builderData it expects; it falls back to a thumbnail." },
      { t: "Implement Use Template functionality", s: "partial",
        p: ["frontend/lib/templateApi.ts", "backend/src/routes/templateRoutes.js"],
        note: "The client calls /api/templates/:id/clone, while the backend exposes POST /api/template/:id/use." },
      { t: "Clone template into user project", s: "partial",
        p: ["backend/src/services/templateService.js", "frontend/lib/templateApi.ts"],
        note: "The backend creates a Workspace, but its response is { workspace } while the client expects { projectId }." },
      { t: "Store templates in database/storage", s: "done",
        p: ["backend/src/models/Template.js", "backend/src/services/templateService.js"],
        note: "Template persistence, list/query service, and seed script are implemented in MongoDB." },
    ],
  },
  {
    id: "m4", num: 4, name: "Drag-and-Drop Builder",
    blurb: "The builder now keeps the stable flow editor as the default and adds an opt-in freeform mode with absolute positioning, snapping, guides, multi-select, layers, pan/zoom, responsive handling, JSON persistence, undo/redo, and static export support.",
    tasks: [
      { t: "Build editor canvas UI", s: "done",
        p: ["frontend/components/builder/Canvas.tsx", "frontend/components/builder/BuilderLayout.tsx"],
        note: "The active editor canvas, palette, property editor, layers, toolbar, and status UI are implemented." },
      { t: "Implement drag-and-drop system", s: "done",
        p: ["frontend/components/builder/BuilderLayout.tsx", "frontend/components/builder/SortableItem.tsx", "frontend/components/builder/FreeformCanvas.tsx"],
        note: "The editor supports dnd-kit flow insertion/reordering plus freeform palette drops and pointer movement for positioned root blocks." },
      { t: "Create text component (add/edit/delete)", s: "done",
        p: ["frontend/components/draggable/TextComponent.tsx", "frontend/components/builder/InlineText.tsx"],
        note: "Text/heading blocks can be added, edited inline, and deleted." },
      { t: "Create image component (upload/select)", s: "done",
        p: ["frontend/components/draggable/ImageComponent.tsx", "frontend/components/assets/AssetManager.tsx"],
        note: "Image selection and local asset handling are implemented; assets currently live in IndexedDB rather than shared storage." },
      { t: "Create video component (embed support)", s: "done",
        p: ["frontend/components/draggable/VideoComponent.tsx", "frontend/components/blocks/video/VideoPanel.tsx"],
        note: "Video blocks and YouTube/Vimeo embed configuration are implemented." },
      { t: "Create button component", s: "done",
        p: ["frontend/components/draggable/ButtonComponent.tsx", "frontend/components/blocks/button/spec.ts"],
        note: "Button blocks and associated controls are implemented." },
      { t: "Implement component positioning (drag/move)", s: "done",
        p: ["frontend/components/builder/Canvas.tsx", "frontend/components/builder/FreeformCanvas.tsx", "frontend/components/builder/FreeformItem.tsx", "frontend/components/builder/freeformGeometry.ts"],
        note: "Freeform mode renders positioned top-level blocks with drag, resize, snap-to-grid, alignment guides, spacing guides, bounds clamping, keyboard nudging, and one undo checkpoint per pointer interaction." },
      { t: "Build layout system (sections/rows/columns)", s: "done",
        p: ["frontend/components/draggable/ContainerComponent.tsx", "frontend/components/draggable/RowComponent.tsx", "frontend/components/draggable/ColumnsComponent.tsx"],
        note: "Nested container, row, and column block types are implemented." },
      { t: "Add styling controls (font, color, spacing)", s: "done",
        p: ["frontend/components/builder/panel/StyleTab.tsx", "frontend/components/builder/panel/controls/"],
        note: "Style controls cover color, typography, spacing, radius, alignment, and responsive overrides." },
      { t: "Implement component settings panel", s: "done",
        p: ["frontend/components/builder/PropertyEditor.tsx", "frontend/components/builder/panel/EffectsTab.tsx"],
        note: "Content, style, effects, and layer controls are present." },
      { t: "Save page structure as JSON", s: "done",
        p: ["frontend/lib/jsonExportImport.ts", "frontend/store/builderStore.ts", "frontend/lib/freeformLayout.ts"],
        note: "Projects can be exported as JSON and persisted through autosave, including freeform position, size, z-index, and canvas mode metadata." },
      { t: "Load saved JSON into editor", s: "done",
        p: ["frontend/lib/jsonExportImport.ts", "frontend/store/builderStore.ts"],
        note: "Project load and schema-validated JSON import are implemented." },
      { t: "Implement undo/redo functionality", s: "done",
        p: ["frontend/store/builderStore.ts", "frontend/components/builder/BuilderLayout.tsx"],
        note: "The builder exposes a capped history stack, keyboard shortcuts, batch freeform moves, duplicate/delete/group commands, and undo-safe style updates." },
    ],
  },
  {
    id: "m5", num: 5, name: "Preview & Responsive Design",
    blurb: "The editor renders generated HTML in desktop, tablet, and mobile iframe previews and exports responsive CSS. Remaining work is device/browser quality assurance, not a missing core implementation.",
    tasks: [
      { t: "Build preview renderer (HTML/CSS output)", s: "done",
        p: ["frontend/components/builder/PreviewModal.tsx", "frontend/lib/exportHtml.ts"],
        note: "The modal receives generated HTML/CSS as a sandboxed iframe document." },
      { t: "Add desktop preview mode", s: "done",
        p: ["frontend/components/builder/PreviewModal.tsx"], note: "Desktop frame option is implemented." },
      { t: "Add mobile preview mode", s: "done",
        p: ["frontend/components/builder/PreviewModal.tsx"], note: "Mobile frame option is implemented." },
      { t: "Add tablet preview mode", s: "done",
        p: ["frontend/components/builder/PreviewModal.tsx"], note: "Tablet frame option is implemented." },
      { t: "Implement responsive breakpoints", s: "done",
        p: ["frontend/components/builder/panel/StyleTab.tsx", "frontend/lib/exportHtml.ts"],
        note: "Responsive style deltas are persisted and emitted as media-query CSS." },
      { t: "Sync editor changes with live preview", s: "done",
        p: ["frontend/components/builder/BuilderLayout.tsx", "frontend/store/builderStore.ts"],
        note: "Preview HTML is regenerated from current editor state." },
      { t: "Optimize layout scaling for devices", s: "done",
        p: ["frontend/components/builder/ZoomControls.tsx", "frontend/components/builder/Canvas.tsx"],
        note: "Viewport widths and canvas zoom controls are present." },
    ],
  },
  {
    id: "m6", num: 6, name: "Domain & Hosting",
    blurb: "The backend contains model/service scaffolding for subdomains and custom domains, but there is no frontend domain management, real DNS routing, site bucket, SSL automation, or deployment connection.",
    tasks: [
      { t: "Generate unique subdomains (username.app.com)", s: "partial",
        p: ["backend/src/services/domainService.js", "backend/src/models/Domain.js"],
        note: "A unique project-name-based subdomain is generated in the service; it is not username.app.com and has no public routing." },
      { t: "Configure DNS/subdomain routing", s: "pending",
        p: [], note: "No Route 53, reverse proxy, edge routing, or equivalent DNS implementation was found." },
      { t: "Setup AWS S3 bucket for projects", s: "partial",
        p: ["backend/src/config/s3.js", "backend/src/middleware/upload.js"],
        note: "An S3 client and in-memory multer configuration exist, but there is no bucket setup, upload route, or S3 command usage." },
      { t: "Upload static files to S3", s: "pending",
        p: [], note: "No site-asset upload or PutObject implementation was found." },
      { t: "Implement custom domain input UI", s: "pending",
        p: ["backend/src/routes/domainRoutes.js"], note: "The backend endpoint exists, but no frontend domain client or settings UI calls it." },
      { t: "Build domain verification flow (DNS check)", s: "partial",
        p: ["backend/src/services/domainService.js", "backend/src/routes/domainRoutes.js"],
        note: "Development returns simulated verification and production returns pending; no real DNS lookup is implemented." },
      { t: "Integrate SSL (AWS ACM/Cloudflare)", s: "pending",
        p: ["backend/src/models/Domain.js"], note: "Only an sslStatus field exists; no provider integration was found." },
      { t: "Connect domain to deployed site", s: "pending",
        p: [], note: "There is no deployed-site target to associate with a domain." },
    ],
  },
  {
    id: "m7", num: 7, name: "Publishing System",
    blurb: "HTML/CSS export and deployment records exist, but publishing is not yet a hosted deployment. The current publish service saves a JSON snapshot and also expects WorkspaceState, which the active builder does not create.",
    tasks: [
      { t: "Convert JSON layout → static HTML", s: "done",
        p: ["frontend/lib/exportHtml.ts", "frontend/store/builderStore.ts"],
        note: "The builder compiles components, SEO, scripts, and styles into HTML." },
      { t: "Generate CSS from styles", s: "done",
        p: ["frontend/lib/exportHtml.ts", "frontend/components/draggable/componentStyles.ts"],
        note: "Generated HTML includes base, component, and responsive CSS." },
      { t: "Bundle assets (images, scripts)", s: "partial",
        p: ["frontend/components/builder/ExportButton.tsx", "frontend/store/assetStore.ts"],
        note: "Manual HTML export embeds local images where possible, but there is no deployable shared asset bundle or CDN pipeline." },
      { t: "Build deployment service (Lambda/API)", s: "partial",
        p: ["backend/src/routes/publishRoutes.js", "backend/src/services/publishService.js"],
        note: "Deployment records and API routes exist, but publish stores a JSON snapshot and fails for active builder projects without a WorkspaceState document." },
      { t: "Deploy site to S3 bucket", s: "pending",
        p: [], note: "No S3 static-site upload or hosting implementation was found." },
      { t: "Implement Publish button", s: "pending",
        p: ["frontend/components/builder/Canvas.tsx"], note: "The active builder has Export/Save controls but no call to /api/publish." },
      { t: "Show deployment status (loading/success/fail)", s: "pending",
        p: [], note: "No builder status dialog or deployment UI consumes deployment states." },
      { t: "Store deployment versions", s: "partial",
        p: ["backend/src/models/Deployment.js", "backend/src/services/publishService.js"],
        note: "Versioned Deployment documents are stored, but they do not represent deployed hosted artifacts." },
      { t: "Implement rollback to previous version", s: "partial",
        p: ["backend/src/services/publishService.js"], note: "The backend can create a rollback record; there is no UI or actual hosting target to roll back." },
    ],
  },
  {
    id: "m8", num: 8, name: "E-commerce (Phase 2)",
    blurb: "Product, order, cart, checkout, storefront runtime, payment verification, and builder product-collection support are implemented in source. Live payment completion still depends on configured Razorpay credentials and production runtime verification.",
    tasks: [
      { t: "Create product schema (DB)", s: "done",
        p: ["backend/src/models/Product.js"], note: "Product schema includes pricing, inventory, images, SKU, options, and variants." },
      { t: "Build product CRUD APIs", s: "done",
        p: ["backend/src/routes/ecommerceRoutes.js", "backend/src/services/ecommerceService.js"],
        note: "Workspace-scoped authenticated product CRUD endpoints are implemented." },
      { t: "Design product management UI", s: "done",
        p: ["frontend/app/dashboard/products/page.tsx", "frontend/lib/ecommerceApi.ts"],
        note: "The management screen is built and the API client normalizes paginated backend responses for CRUD workflows." },
      { t: "Add products to pages", s: "done",
        p: ["frontend/components/blocks/product-collection/spec.ts", "frontend/components/draggable/ProductCollectionComponent.tsx", "frontend/lib/blockRegistry.ts", "frontend/lib/componentRegistry.ts"],
        note: "A product-collection block is registered for the builder, exports catalog markup, and can be configured with sample products or published product IDs." },
      { t: "Implement cart system (add/remove/update)", s: "done",
        p: ["backend/src/services/cartService.js", "backend/src/routes/cartRoutes.js", "frontend/lib/storefrontRuntime.ts", "frontend/lib/storefrontApi.ts"],
        note: "Authenticated cart routes and the published-site storefront runtime support add, remove, update, clear, and local fallback behavior." },
      { t: "Build checkout flow", s: "done",
        p: ["backend/src/services/checkoutService.js", "backend/src/routes/checkoutRoutes.js", "frontend/lib/storefrontRuntime.ts"],
        note: "Checkout creation, order verification, cart clearing, and storefront status handling are implemented, with server-side totals and inventory validation." },
      { t: "Integrate payment gateway", s: "done",
        p: ["backend/src/services/checkoutService.js", "frontend/lib/razorpayClient.ts", "frontend/lib/storefrontRuntime.ts"],
        note: "Razorpay order creation and signature verification are wired in source; live completion requires production credentials and an end-to-end payment run." },
      { t: "Store order details", s: "done",
        p: ["backend/src/models/Order.js", "backend/src/services/checkoutService.js"],
        note: "Checkout service writes Order documents with items, totals, payment metadata, and addresses." },
      { t: "Create order management dashboard", s: "done",
        p: ["frontend/app/dashboard/orders/page.tsx", "frontend/lib/ecommerceApi.ts"],
        note: "The merchant order view and status-update controls are implemented against e-commerce order endpoints." },
    ],
  },
  {
    id: "m9", num: 9, name: "Blog & SEO",
    blurb: "Workspace-scoped blog CRUD and editor screens are present. Public publishing, clean generated slug routes, sitemap delivery, and crawler-ready metadata remain incomplete under static export.",
    tasks: [
      { t: "Create blog post schema", s: "done",
        p: ["backend/src/models/BlogPost.js", "frontend/types/blog.ts"], note: "Posts include title, content, status, cover image, tags, and SEO fields." },
      { t: "Build blog editor UI", s: "done",
        p: ["frontend/components/blog/BlogForm.tsx", "frontend/app/blog/manage/"], note: "Create, edit, and management views are implemented." },
      { t: "Implement post creation/edit/delete", s: "done",
        p: ["backend/src/routes/blogRoutes.js", "frontend/lib/blogApi.ts"], note: "Authenticated blog CRUD calls align with the active /api/blog routes." },
      { t: "Generate slug-based URLs", s: "partial",
        p: ["backend/src/services/blogService.js", "frontend/app/blog/[slug]/page.tsx"],
        note: "Backend slugs are generated, but the frontend public route needs workspaceId context and static export cannot pre-generate arbitrary new post slugs." },
      { t: "Add SEO metadata fields (title, description)", s: "done",
        p: ["frontend/components/blog/BlogForm.tsx", "backend/src/models/BlogPost.js"],
        note: "The editor persists SEO title, description, and keywords." },
      { t: "Generate sitemap.xml", s: "partial",
        p: ["backend/src/services/blogService.js", "backend/src/routes/blogRoutes.js"],
        note: "The backend emits per-workspace XML at /api/blog/sitemap/:workspaceId; it is not integrated as a deployed site-root sitemap.xml." },
      { t: "Add Open Graph/meta tags", s: "partial",
        p: ["frontend/lib/exportHtml.ts", "frontend/components/blog/BlogSeoHead.tsx"],
        note: "Exported pages include OG tags, but blog metadata is injected after hydration and is not reliably crawler-ready." },
      { t: "Implement blog listing page", s: "partial",
        p: ["frontend/app/blog/page.tsx", "frontend/lib/blogApi.ts"],
        note: "The route is a marketing page rather than a live listing of a workspace's published posts." },
    ],
  },
  {
    id: "m10", num: 10, name: "Analytics Dashboard",
    blurb: "An event-ingestion API, MongoDB aggregation, generated-site tracker, and dashboard are implemented. Saved-project HTML and downloaded HTML now carry the same valid workspace ID, while previews and drafts remain excluded from tracking. Hosted origin/CORS configuration remains a deployment concern.",
    tasks: [
      { t: "Track page views (basic tracking script)", s: "done",
        p: ["frontend/lib/analyticsTracking.ts", "frontend/lib/exportHtml.ts", "frontend/components/builder/ExportButton.tsx", "frontend/components/builder/PreviewModal.tsx", "backend/src/routes/analyticsRoutes.js"],
        note: "Generated pages automatically post one page view per route/load with workspace ID, path, privacy-safe referrer, timestamp, and session ID. Saved exports now receive the active workspace ID; missing or invalid IDs omit the tracker safely, and preview/draft documents are excluded." },
      { t: "Store analytics data", s: "done",
        p: ["backend/src/models/AnalyticsEvent.js", "backend/src/services/analyticsService.js"],
        note: "Events are persisted with indexes and a 90-day retention policy." },
      { t: "Build analytics dashboard UI", s: "done",
        p: ["frontend/app/dashboard/analytics/page.tsx"], note: "The dashboard fetches per-project data, supports date filters, and exports CSV." },
      { t: "Display traffic metrics (views, visitors)", s: "done",
        p: ["backend/src/services/analyticsService.js", "frontend/app/dashboard/analytics/page.tsx"],
        note: "Views, visitors, daily traffic, top pages, and activity are aggregated from stored events." },
      { t: "Add charts (daily/weekly stats)", s: "done",
        p: ["frontend/app/dashboard/analytics/page.tsx"], note: "The dashboard renders daily and weekly traffic charts from API data." },
      { t: "Integrate Google Analytics (optional)", s: "pending",
        p: [], note: "No Google Analytics integration was found; this remains optional because first-party analytics is already implemented." },
    ],
  },
  {
    id: "m11", num: 11, name: "AI Content Assistant",
    blurb: "A server-side, provider-abstracted AI assistant now powers copy, image/placeholder, and layout workflows. It keeps credentials off the client, validates and rate-limits requests, and writes results through the existing builder history and asset paths. Configure a server-side provider key to enable live OpenAI generation; the local placeholder and layout suggestion flows remain available without one.",
    tasks: [
      { t: "Integrate AI text generation API", s: "done", p: ["backend/src/routes/aiRoutes.js", "backend/src/services/ai/AIProviderFactory.js", "backend/src/services/ai/PromptBuilder.js", "frontend/lib/aiApi.ts"], note: "Authenticated text generation uses a provider abstraction, the server-safe BlockSpec AI catalog, input validation, rate limits, cancellation, and per-user caching." },
      { t: "Add Generate Text button in editor", s: "done", p: ["frontend/components/builder/PropertyEditor.tsx", "frontend/components/builder/PanelFields.tsx", "frontend/components/builder/AIAssistDialog.tsx"], note: "Shared editor fields gain an animated Generate Text action with preview, replace, insert, regenerate, cancellation, and error handling." },
      { t: "Generate content for sections (hero, about, etc.)", s: "done", p: ["backend/src/services/ai/PromptBuilder.js", "frontend/components/builder/AIAssistDialog.tsx"], note: "Supported section panels can request coordinated fields; the dialog maps reviewed output back through each existing field setter so history, autosave, preview, and export stay synchronized." },
      { t: "Integrate AI image generation API", s: "done", p: ["backend/src/services/ai/OpenAIProvider.js", "backend/src/services/ai/ImageProvider.js", "frontend/components/assets/AIImageGenerator.tsx"], note: "Provider-backed generation returns a storable image URL/data URL and persists it through the existing IndexedDB asset pipeline." },
      { t: "Add image placeholder generator", s: "done", p: ["backend/src/services/ai/ImageProvider.js", "frontend/components/assets/AssetManager.tsx"], note: "A deterministic server-side SVG placeholder flow creates relevant reusable assets without needing an external image key." },
      { t: "Suggest layouts based on content type", s: "done", p: ["backend/src/services/ai/LayoutSuggestion.js", "frontend/components/builder/AILayoutDialog.tsx", "frontend/store/builderStore.ts"], note: "The user reviews a business-aware layout proposal before applying it as one validated, undoable builder change." },
    ],
  },
];

const MOD_ICON = {
  m1: "i-lock", m2: "i-dashboard", m3: "i-template", m4: "i-grid",
  m5: "i-smartphone", m6: "i-globe", m7: "i-rocket", m8: "i-cart",
  m9: "i-pen", m10: "i-chart", m11: "i-sparkles",
};

const BACKENDS = [
  {
    cls: "be-live",
    tag: "Source-audited",
    name: "Unified Express backend",
    path: "backend/src/",
    desc: "One Express app mounts authentication, projects, templates, payments, domains, publishing, commerce, blogs, and analytics. This dashboard audits source and contracts; it does not claim that external credentials, MongoDB, or hosting infrastructure are running."
  }
];

const MOD_APIS = {
  m1: [
    { m: "POST", path: "/api/auth/register", be: "source" },
    { m: "POST", path: "/api/auth/login", be: "source" },
    { m: "POST", path: "/api/auth/refresh", be: "source" },
    { m: "POST", path: "/api/auth/forgot-password", be: "source" },
    { m: "POST", path: "/api/auth/verify-email", be: "source" },
    { m: "POST", path: "/api/auth/verify-mobile", be: "source" },
    { m: "GET / PUT", path: "/api/user/profile", be: "source" },
    { m: "POST", path: "/api/payment/create-checkout", be: "source" },
    { m: "POST", path: "/api/razorpay/create-order", be: "source" },
  ],
  m2: [
    { m: "GET / POST", path: "/api/projects", be: "source" },
    { m: "GET / PUT / DELETE", path: "/api/projects/:id", be: "source" },
    { m: "PUT", path: "/api/projects/:id/autosave", be: "source" },
    { m: "PUT", path: "/api/projects/:id/save-html", be: "source" },
    { m: "GET", path: "/api/dashboard/summary", be: "source" },
  ],
  m3: [
    { m: "GET", path: "/api/template/list", be: "source" },
    { m: "GET", path: "/api/template/:idOrSlug", be: "source" },
    { m: "POST", path: "/api/template/:id/use", be: "source" },
  ],
  m4: [
    { m: "PUT", path: "/api/projects/:id/autosave", be: "source" },
    { m: "PUT", path: "/api/projects/:id/save-html", be: "source" },
  ],
  m5: [],
  m6: [
    { m: "POST", path: "/api/domain/:workspaceId/subdomain", be: "scaffold" },
    { m: "PUT", path: "/api/domain/:workspaceId/custom", be: "scaffold" },
    { m: "POST", path: "/api/domain/:workspaceId/verify-dns", be: "scaffold" },
  ],
  m7: [
    { m: "POST", path: "/api/publish/:workspaceId", be: "scaffold" },
    { m: "GET", path: "/api/publish/:workspaceId/deployments", be: "scaffold" },
    { m: "POST", path: "/api/publish/:workspaceId/rollback/:deploymentId", be: "scaffold" },
  ],
  m8: [
    { m: "GET", path: "/api/ecommerce/store/:workspaceId/products", be: "source" },
    { m: "POST", path: "/api/ecommerce/product", be: "source" },
    { m: "GET", path: "/api/ecommerce/products/:workspaceId", be: "source" },
    { m: "GET / POST", path: "/api/cart/:workspaceId/items", be: "source" },
    { m: "PUT / DELETE", path: "/api/cart/:workspaceId/items/:itemId", be: "source" },
    { m: "POST", path: "/api/checkout/create-order", be: "source" },
    { m: "POST", path: "/api/checkout/verify-payment", be: "source" },
    { m: "GET", path: "/api/checkout/orders", be: "source" },
    { m: "GET / PUT", path: "/api/ecommerce/orders/:workspaceId", be: "source" },
  ],
  m9: [
    { m: "POST", path: "/api/blog/post", be: "source" },
    { m: "GET", path: "/api/blog/posts/:workspaceId", be: "source" },
    { m: "GET", path: "/api/blog/public/:workspaceId/:slug", be: "source" },
    { m: "GET", path: "/api/blog/sitemap/:workspaceId", be: "source" },
  ],
  m10: [
    { m: "POST", path: "/api/analytics/event", be: "source" },
    { m: "GET", path: "/api/analytics/:workspaceId", be: "source" },
  ],
  m11: [
    { m: "POST", path: "/api/ai/generate-text", be: "source" },
    { m: "POST", path: "/api/ai/generate-image", be: "source" },
    { m: "POST", path: "/api/ai/suggest-layout", be: "source" },
  ],
};

const RM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = { filter: "all", query: "" };

function esc(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function ico(id, cls) {
  return '<svg class="ico' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#' + id + '"/></svg>';
}

function countTasks(module) {
  const count = { done: 0, partial: 0, pending: 0, total: module.tasks.length };
  module.tasks.forEach(function (task) { count[task.s] += 1; });
  return count;
}

function progress(count) {
  return Math.round(((count.done + count.partial * 0.5) / count.total) * 100);
}

function totals() {
  const total = { done: 0, partial: 0, pending: 0, total: 0 };
  MODULES.forEach(function (module) {
    const count = countTasks(module);
    total.done += count.done;
    total.partial += count.partial;
    total.pending += count.pending;
    total.total += count.total;
  });
  return total;
}

function kpiCard(kind, label, value, suffix, description) {
  return '<div class="col-6 col-lg-3"><div class="kpi k-' + kind + '">' +
    '<div class="kpi-value"><span class="tnum" data-count-to="' + value + '">0</span>' +
    (suffix ? '<span class="suf">' + suffix + '</span>' : "") + '</div>' +
    '<div class="kpi-label">' + label + '</div><div class="kpi-sub">' + description + '</div></div></div>';
}

function renderTotals() {
  const total = totals();
  const percentage = progress(total);
  document.getElementById("kpiRow").innerHTML =
    kpiCard("overall", "Implementation coverage", percentage, "%", total.total + " requested tasks") +
    kpiCard("done", "Done", total.done, "", "implemented in source") +
    kpiCard("partial", "Partial", total.partial, "", "needs integration or QA") +
    kpiCard("pending", "Pending", total.pending, "", "not implemented");

  document.getElementById("overallBar").innerHTML =
    '<div class="stack-bar" role="img" aria-label="' + total.done + ' done, ' + total.partial + ' partial, ' + total.pending + ' pending">' +
    '<span class="seg st-done" data-w="' + ((total.done / total.total) * 100) + '"></span>' +
    '<span class="seg st-partial" data-w="' + ((total.partial / total.total) * 100) + '"></span>' +
    '<span class="seg st-pending" data-w="' + ((total.pending / total.total) * 100) + '"></span></div>';

  document.getElementById("overallLegend").innerHTML =
    '<span><i class="st-done"></i> ' + total.done + ' done</span>' +
    '<span><i class="st-partial"></i> ' + total.partial + ' partial</span>' +
    '<span><i class="st-pending"></i> ' + total.pending + ' pending</span>';

  document.getElementById("deltaPill").innerHTML = ico("i-check") + " source audit";
  document.querySelectorAll(".fcount").forEach(function (element) {
    const key = element.dataset.count;
    element.textContent = key === "all" ? total.total : total[key];
  });
}

function renderMeta() {
  document.getElementById("stackList").innerHTML = PROJECT.stack.map(function (row) {
    return '<li><span class="meta-k">' + esc(row[0]) + '</span><span class="meta-v">' + esc(row[1]) + '</span></li>';
  }).join("");
  document.getElementById("entryList").innerHTML = PROJECT.entry.map(function (row) {
    return '<li><span class="meta-k">' + esc(row[0]) + '</span><span class="meta-v"><code>' + esc(row[1]) + '</code></span></li>';
  }).join("");
  document.getElementById("backendMap").innerHTML = BACKENDS.map(function (backend) {
    return '<div class="be-card ' + backend.cls + '"><div class="be-top"><span class="be-dot"></span>' +
      '<span class="be-name">' + esc(backend.name) + '</span><span class="be-tag">' + esc(backend.tag) + '</span></div>' +
      '<div class="be-path">' + esc(backend.path) + '</div><p class="be-desc">' + esc(backend.desc) + '</p></div>';
  }).join("");
}

function renderNav() {
  document.getElementById("moduleNav").innerHTML = MODULES.map(function (module) {
    return '<a class="nav-link" href="#' + module.id + '" data-mod="' + module.id + '">' +
      ico(MOD_ICON[module.id]) + '<span class="nav-txt">M' + module.num + ' · ' + esc(module.name) + '</span>' +
      '<span class="nav-pct tnum">' + progress(countTasks(module)) + '%</span></a>';
  }).join("");
}

function topStatus(count) {
  if (count.pending > count.done && count.pending > count.partial) return "pending";
  if (count.partial > 0 && count.partial >= count.done) return "partial";
  return "done";
}

function renderApiRow(api) {
  const source = api.be === "source";
  const methodClass = "m-" + api.m.split(/[ /]/)[0];
  return '<div class="api-row"><span class="api-m ' + methodClass + '">' + esc(api.m) + '</span>' +
    '<span class="api-path">' + esc(api.path) + '</span><span class="api-be ' + (source ? "live" : "full") + '">' +
    (source ? "Source" : "Scaffold") + '</span></div>';
}

function renderTaskRow(task) {
  const paths = task.p.length
    ? '<div class="paths">' + task.p.map(function (path) {
      return '<button type="button" class="path" data-copy="' + esc(path) + '" title="Copy path">' + esc(path) + ico("i-copy", "copy-ico") + '</button>';
    }).join("") + '</div>'
    : '<div class="paths"><span class="path-none">— no file yet —</span></div>';
  const note = task.note ? '<p class="note">' + esc(task.note) + '</p>' : "";
  const haystack = (task.t + " " + (task.note || "") + " " + task.p.join(" ")).toLowerCase();
  const label = task.s.charAt(0).toUpperCase() + task.s.slice(1);
  return '<tr class="task-row" data-status="' + task.s + '" data-search="' + esc(haystack) + '">' +
    '<td class="cell-dot"><span class="tdot st-' + task.s + '"></span></td>' +
    '<td class="cell-task">' + esc(task.t) + '</td><td class="cell-status"><span class="badge st-' + task.s + '">' + label + '</span></td>' +
    '<td class="cell-paths">' + paths + note + '</td></tr>';
}

function renderModuleCard(module) {
  const count = countTasks(module);
  const completion = progress(count);
  const apis = MOD_APIS[module.id] || [];
  const apiBlock = apis.length
    ? '<details class="apis"><summary>' + ico("i-server") + 'Backend endpoints <span class="tnum" style="opacity:.6">(' + apis.length + ')</span><span class="chev">›</span></summary>' +
      '<div class="api-list">' + apis.map(renderApiRow).join("") + '</div></details>'
    : '<div class="apis"><div class="api-row"><span style="color:var(--text-faint);font-size:12px;padding:2px 0">No backend endpoints are expected for this module.</span></div></div>';
  return '<section class="module-card" id="' + module.id + '" data-mod="' + module.id + '">' +
    '<header class="module-head"><div class="module-title"><span class="module-ico">' + ico(MOD_ICON[module.id]) + '</span><div>' +
    '<div class="module-kick">Module ' + module.num + '</div><h2>' + esc(module.name) + '</h2><p class="module-blurb">' + esc(module.blurb) + '</p></div></div>' +
    '<div class="module-meter"><div class="ring-wrap" role="img" aria-label="' + completion + '% complete">' +
    '<svg viewBox="0 0 36 36"><circle class="ring-track" cx="18" cy="18" r="15.915"/><circle class="ring-fill st-' + topStatus(count) + '" cx="18" cy="18" r="15.915" data-pct="' + completion + '"/></svg>' +
    '<span class="ring-num tnum">' + completion + '%</span></div><div class="chips"><span class="chip st-done">' + count.done + ' done</span>' +
    '<span class="chip st-partial">' + count.partial + ' partial</span><span class="chip st-pending">' + count.pending + ' pending</span></div></div></header>' +
    '<div class="stack-bar slim" role="img" aria-label="' + count.done + ' done, ' + count.partial + ' partial, ' + count.pending + ' pending">' +
    '<span class="seg st-done" data-w="' + ((count.done / count.total) * 100) + '"></span><span class="seg st-partial" data-w="' + ((count.partial / count.total) * 100) + '"></span>' +
    '<span class="seg st-pending" data-w="' + ((count.pending / count.total) * 100) + '"></span></div>' + apiBlock +
    '<div class="table-wrap"><table class="task-table"><thead><tr><th></th><th>Sprint task</th><th>Status</th><th>Path examples &amp; notes</th></tr></thead>' +
    '<tbody>' + module.tasks.map(renderTaskRow).join("") + '</tbody></table></div></section>';
}

function renderModules() {
  document.getElementById("modules").innerHTML = MODULES.map(renderModuleCard).join("");
  applyFilters();
}

function applyFilters() {
  let shown = 0;
  let all = 0;
  const query = state.query.trim().toLowerCase();
  document.querySelectorAll(".module-card").forEach(function (card) {
    let visibleTask = false;
    card.querySelectorAll(".task-row").forEach(function (row) {
      all += 1;
      const matchesFilter = state.filter === "all" || row.dataset.status === state.filter;
      const matchesQuery = !query || row.dataset.search.includes(query);
      const visible = matchesFilter && matchesQuery;
      row.style.display = visible ? "" : "none";
      if (visible) {
        visibleTask = true;
        shown += 1;
      }
    });
    card.style.display = visibleTask ? "" : "none";
  });
  document.getElementById("emptyState").hidden = shown !== 0;
  const counter = document.getElementById("searchCount");
  counter.textContent = (state.filter !== "all" || query) ? shown + " of " + all + " tasks" : "";
}

function animateNumbers(scope) {
  scope.querySelectorAll("[data-count-to]").forEach(function (element) {
    if (element.dataset.done) return;
    element.dataset.done = "1";
    const destination = Number(element.dataset.countTo);
    if (RM) {
      element.textContent = String(destination);
      return;
    }
    const duration = 700;
    const start = performance.now();
    function step(now) {
      const ratio = Math.min(1, (now - start) / duration);
      element.textContent = String(Math.round(destination * (1 - Math.pow(1 - ratio, 3))));
      if (ratio < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

function reveal(scope) {
  scope.classList.add("in");
  scope.querySelectorAll(".seg[data-w]").forEach(function (segment) {
    segment.style.width = segment.dataset.w + "%";
  });
  scope.querySelectorAll(".ring-fill[data-pct]").forEach(function (ring) {
    ring.style.strokeDasharray = ring.dataset.pct + " 100";
  });
  animateNumbers(scope);
}

function wireControls() {
  const search = document.getElementById("searchInput");
  const sidebar = document.getElementById("sidebar");
  const navToggle = document.getElementById("navToggle");
  const themeToggle = document.getElementById("themeToggle");
  const live = document.getElementById("liveRegion");

  document.querySelectorAll("[data-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.filter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(function (candidate) {
        const active = candidate === button;
        candidate.classList.toggle("active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      applyFilters();
    });
  });

  search.addEventListener("input", function () {
    state.query = search.value;
    applyFilters();
  });

  document.getElementById("clearFilters").addEventListener("click", function () {
    state.filter = "all";
    state.query = "";
    search.value = "";
    document.querySelectorAll("[data-filter]").forEach(function (button) {
      const active = button.dataset.filter === "all";
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    applyFilters();
    search.focus();
  });

  document.addEventListener("click", function (event) {
    const button = event.target.closest(".path[data-copy]");
    if (!button) return;
    const copied = function () {
      button.classList.add("copied");
      const use = button.querySelector("use");
      if (use) use.setAttribute("href", "#i-check");
      if (live) live.textContent = "Copied " + button.dataset.copy;
      window.setTimeout(function () {
        button.classList.remove("copied");
        if (use) use.setAttribute("href", "#i-copy");
      }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(button.dataset.copy).then(copied).catch(copied);
    } else {
      copied();
    }
  });

  const root = document.documentElement;
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
    try { localStorage.setItem("stackly-docs-theme", theme); } catch (_) {}
  }
  let savedTheme = null;
  try { savedTheme = localStorage.getItem("stackly-docs-theme"); } catch (_) {}
  applyTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeToggle.addEventListener("click", function () {
    applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  if (navToggle && sidebar) {
    navToggle.addEventListener("click", function () {
      const open = !sidebar.classList.contains("open");
      sidebar.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
    sidebar.addEventListener("click", function (event) {
      if (event.target.closest(".nav-link")) {
        sidebar.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const backToTop = document.getElementById("backToTop");
  function onScroll() {
    const show = window.scrollY > 520;
    backToTop.hidden = false;
    backToTop.classList.toggle("show", show);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" });
  });

  document.addEventListener("keydown", function (event) {
    const typing = /^(input|textarea|select)$/i.test(event.target.tagName);
    if (event.key === "/" && !typing) {
      event.preventDefault();
      search.focus();
      search.select();
    } else if ((event.key === "t" || event.key === "T") && !typing) {
      themeToggle.click();
    } else if (event.key === "Escape" && event.target === search) {
      state.query = "";
      search.value = "";
      applyFilters();
      search.blur();
    }
  });

  const revealTargets = document.querySelectorAll(".reveal, .module-card");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
    revealTargets.forEach(function (target) { observer.observe(target); });
  } else {
    revealTargets.forEach(reveal);
  }
  window.requestAnimationFrame(function () {
    revealTargets.forEach(function (target) {
      if (target.getBoundingClientRect().top < window.innerHeight) reveal(target);
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("projName").textContent = "Stackly";
  document.getElementById("projTagline").textContent = PROJECT.tagline;
  document.getElementById("genDate").textContent = "Audited " + AUDIT_DATE + " · source and contract review";
  const whatsNew = document.getElementById("whatsNew");
  whatsNew.innerHTML = '<span class="wn-badge">AUDIT</span><div class="wn-body"><h3>' + esc(WHATSNEW.title) + '</h3><p>' + esc(WHATSNEW.body) + '</p></div>';
  renderMeta();
  renderNav();
  renderTotals();
  renderModules();
  wireControls();
});
