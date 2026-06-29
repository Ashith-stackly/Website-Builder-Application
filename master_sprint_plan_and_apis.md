# Stackly — Master Sprint Plan & Backend API Requirements

This document maps out the status of all sprint tasks across **11 modules**, details the work remaining for the **frontend team**, and provides the exact **backend API specifications** that the backend team needs to deliver.

---

## 🗺️ Module Overview & Current Status

| Module | Name | Status | Key Missing Link |
|---|---|---|---|
| **Module 1** | Authentication & User Management | 🟡 Partial | Persistent sessions, user settings, subscription lifecycle gates |
| **Module 2** | Workspace & Dashboard | 🟡 Partial | Migrate `localStorage` state to backend Project APIs |
| **Module 3** | Template Library | 🟡 Partial | Template Marketplace Page, clone-to-project endpoint |
| **Module 4** | Drag-and-Drop Builder | 🟡 Partial | Server auto-save, cloud asset manager (replace IndexedDB) |
| **Module 5** | Preview & Responsive Design | ✅ Complete | Viewports, Zoom, HTML compiler are all fully functional |
| **Module 6** | Domain & Hosting | ❌ Not Started | Custom domain settings panel, SSL & CNAME verification |
| **Module 7** | Publishing System | 🟡 Partial | Publish buttons, S3 build service, deployment versioning |
| **Module 8** | E-commerce (Phase 2) | ❌ Not Started | Product CRUD UI, Canvas Cart/Checkout block, order capture |
| **Module 9** | Blog & SEO | 🟡 Partial | SEO Panel is done; Blog CMS post editor & list are pending |
| **Module 10** | Analytics Dashboard | 🟡 Partial | Analytics UI is done; needs server event ingestion & aggregation |
| **Module 11** | AI Content Assistant | ❌ Not Started | AI text proxy, AI image gen proxy, and layout generator |

---

## 🛠️ Detailed Module-by-Module Sprint Plan

---

### MODULE 1: Authentication & User Management
**Current Status**: UI pages are ready (Login, Signup, Reset Flow, Google OAuth, OTP screens). Standard validators and validation helpers are in place. Express reference controller exists at `test/controllers/authController.js`.
* **Frontend Work**:
  * Build persistent session manager & middleware route guards (`hooks/useAuth.ts` or `lib/authSession.ts`).
  * Wire user profile settings editing in `app/dashboard/settings/page.tsx`.
  * Lock premium features (Task 17) based on user plan state.
  * Wire plan subscription buttons to payment and subscription status.
* **Backend APIs Required**:
  * `POST /api/auth/register` — Create user
  * `POST /api/auth/login` — Authenticate and return JWT token
  * `POST /api/auth/forgot-password` — Request password reset email/SMS OTP
  * `POST /api/auth/verify-email` — Verify email OTP and return registration completion token
  * `POST /api/auth/verify-mobile` — Verify mobile OTP
  * `POST /api/auth/reset-password` — Reset password using verification token
  * `GET /api/users/me` — Retrieve active user session profile
  * `PUT /api/users/me` — Update name, avatar, and settings
  * `POST /api/subscription/cancel` — Cancel active subscription

#### API Contracts for Backend Team:
```json
// POST /api/auth/register
// Body:
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "mobile": "9876543210",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
// Response (201):
{
  "message": "User registered successfully"
}

// POST /api/auth/login
// Body:
{
  "email": "jane@example.com", // OR mobile: "9876543210"
  "password": "Password123!"
}
// Response (200):
{
  "message": "Login successful",
  "token": "eyJhbGciOi...",
  "userType": "client"
}

// GET /api/users/me
// Headers: Authorization: Bearer <token>
// Response (200):
{
  "id": "user_67890",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "mobile": "9876543210",
  "plan": {
    "type": "pro", // "free" | "starter" | "pro" | "enterprise"
    "expiresAt": "2026-12-31T23:59:59.999Z",
    "features": ["custom-domain", "analytics", "premium-templates"]
  },
  "avatar": "https://stackly-assets.s3.amazonaws.com/avatars/user_67890.png"
}
```

---

### MODULE 2: Workspace & Dashboard
**Current Status**: Complete UI exists for Project listings, Stats, and Settings dashboard. Project configuration actions (create, duplicate, delete, search, sort) are built inside `store/projectStore.ts` using `localStorage` persistence.
* **Frontend Work**:
  * Replace the mock logic in `store/projectStore.ts` with server-side API requests.
  * Auto-inject Bearer authentication headers inside `lib/projectApi.ts`.
* **Backend APIs Required**:
  * `GET /api/projects` — List user's projects with filtering, sorting, and search query parameters.
  * `POST /api/projects` — Create empty project with options.
  * `GET /api/projects/:id` — Fetch detailed project canvas builder state.
  * `PUT /api/projects/:id` — Save components and layout configuration.
  * `PUT /api/projects/:id/autosave` — Auto-save canvas snapshot.
  * `POST /api/projects/:id/duplicate` — Duplicate project record.
  * `DELETE /api/projects/:id` — Delete project record (and clean up published assets).

#### API Contracts for Backend Team:
```json
// POST /api/projects
// Headers: Authorization: Bearer <token>
// Body:
{
  "projectName": "My Portfolio",
  "category": "Portfolio",
  "style": "Minimal",
  "sections": ["hero", "features", "contact"]
}
// Response (201):
{
  "success": true,
  "project": {
    "_id": "proj_12345",
    "projectName": "My Portfolio",
    "category": "Portfolio",
    "style": "Minimal",
    "builderData": {
      "components": [],
      "designTokens": {},
      "seo": {}
    },
    "createdAt": "2026-06-29T18:00:00.000Z"
  }
}
```

---

### MODULE 3: Template Library
**Current Status**: 12 pre-designed sections are defined in `lib/sectionTemplates.ts`. Project category designs (Portfolio, E-commerce, Restaurant, Blog, Business) are loaded during project creation inside `builderStore.ts`.
* **Frontend Work**:
  * Build template listing UI and marketplace page at `app/templates/page.tsx` with search and filters.
  * Add template preview iframe viewer.
  * Map "Use Template" action to request template cloning via backend.
* **Backend APIs Required**:
  * `GET /api/templates` — List available templates.
  * `GET /api/templates/:id` — Get single template details.
  * `POST /api/templates/:id/clone` — Clone template layout directly to user projects folder.

#### API Contracts for Backend Team:
```json
// GET /api/templates?category=Portfolio
// Response (200):
{
  "success": true,
  "templates": [
    {
      "id": "temp_portfolio_1",
      "name": "Creative Agency",
      "category": "Portfolio",
      "style": "Modern",
      "thumbnail": "https://stackly-templates.s3.amazonaws.com/thumb_portfolio_1.webp",
      "isPremium": false
    }
  ]
}

// POST /api/templates/:id/clone
// Headers: Authorization: Bearer <token>
// Response (201):
{
  "success": true,
  "projectId": "proj_99887"
}
```

---

### MODULE 4: Drag-and-Drop Builder
**Current Status**: Complete visual canvas is functional with pointer sensors, Snap Guides, multi-element select, layers list, lock controls, keyboard shortcuts, zoom controls, and Global Styles Panel. Style/Effect overrides are done. Row and Column layouts are supported.
* **Frontend Work**:
  * Wire the debounced server-side auto-save request to run every 30 seconds inside `builderStore.ts`.
  * Replace the local browser **IndexedDB** asset storage with Cloud Upload UI in `AssetManager.tsx`.
* **Backend APIs Required**:
  * `POST /api/assets/upload` — Upload file to S3 and return secure URL.
  * `GET /api/assets` — Retrieve list of uploaded files.
  * `DELETE /api/assets/:id` — Delete file from S3 library.

#### API Contracts for Backend Team:
```json
// POST /api/assets/upload
// Headers: Authorization: Bearer <token>
// Body (Multipart Form): file: <image.png>
// Response (200):
{
  "success": true,
  "asset": {
    "id": "asset_44321",
    "name": "hero-bg.webp",
    "url": "https://stackly-assets.s3.amazonaws.com/user_67890/hero-bg.webp"
  }
}
```

---

### MODULE 5: Preview & Responsive Design
**Current Status**: ✅ **100% Complete**.
* **Frontend Work**: None required. Viewport sizes (Desktop, Mobile, Tablet) switch correctly, media queries compile and style elements at 1280px, 768px, and 390px, and changes are synced instantly inside the preview iframe.
* **Backend APIs Required**: None.

---

### MODULE 6: Domain & Hosting
**Current Status**: UI and infrastructure are not started.
* **Frontend Work**:
  * Create custom domain configuration settings panel at `app/dashboard/settings/page.tsx`.
  * Display step-by-step CNAME validation guide (e.g. point to `domains.thestackly.com`).
* **Backend/Infra Work**:
  * Generate unique subdomains (username.app.com) and support dynamic routing via Lambda@Edge or reverse proxy (Nginx).
  * Build domain validation script (checks propagation of TXT/CNAME records).
  * Automate SSL issuance (AWS Certificate Manager or Let's Encrypt).
* **Backend APIs Required**:
  * `POST /api/projects/:id/domain` — Connect a custom domain.
  * `GET /api/projects/:id/domain/verify` — Check verification record configuration status.

#### API Contracts for Backend Team:
```json
// POST /api/projects/:id/domain
// Headers: Authorization: Bearer <token>
// Body:
{
  "customDomain": "www.my-agency.com"
}
// Response (200):
{
  "success": true,
  "verificationRecord": {
    "type": "CNAME",
    "host": "www",
    "value": "domains.thestackly.com"
  }
}
```

---

### MODULE 7: Publishing System
**Current Status**: Static HTML exporter is ready (`lib/exportHtml.ts` compiles full pages with responsive styles). Download logic exists. Live S3 build/publish service is pending.
* **Frontend Work**:
  * Create a prominent "Publish" button in the builder toolbar.
  * Build deployment status modal showing loading, success (with live link), or error state.
  * Build Deployment History list component displaying versions and rollbacks.
* **Backend APIs Required**:
  * `POST /api/projects/:id/publish` — Generate HTML, upload assets/HTML file to S3, invalidate CloudFront caches.
  * `GET /api/projects/:id/deployments` — Get list of past published versions.
  * `POST /api/projects/:id/deployments/:version/rollback` — Restore a past version.

#### API Contracts for Backend Team:
```json
// POST /api/projects/:id/publish
// Headers: Authorization: Bearer <token>
// Response (200):
{
  "success": true,
  "deploymentId": "deploy_887766",
  "url": "https://mysite.stackly.studio"
}
```

---

### MODULE 8: E-commerce (Phase 2)
**Current Status**: Static product listing showcases exist inside the landing grids. Functional cart/checkout components do not exist.
* **Frontend Work**:
  * Build product management UI (CRUD) panel in the builder sidebar.
  * Build draggable Cart component and Checkout component blocks.
  * Connect Checkout actions with Razorpay gateway handler.
* **Backend APIs Required**:
  * `GET /api/projects/:id/products` — List store products.
  * `POST /api/projects/:id/products` — Create product.
  * `PUT /api/projects/:id/products/:productId` — Edit product details.
  * `DELETE /api/projects/:id/products/:productId` — Remove product.
  * `POST /api/projects/:id/orders` — Record client order and payment details.
  * `GET /api/projects/:id/orders` — List merchant orders on dashboard.

#### API Contracts for Backend Team:
```json
// POST /api/projects/:id/products
// Headers: Authorization: Bearer <token>
// Body:
{
  "name": "Premium T-Shirt",
  "price": 1299.00,
  "description": "100% Cotton premium tee",
  "images": ["https://stackly-assets.s3.amazonaws.com/tshirt.png"],
  "inventory": 50
}
// Response (201):
{
  "success": true,
  "product": {
    "id": "prod_cloth_1122",
    "name": "Premium T-Shirt",
    "price": 1299.00,
    "inventory": 50
  }
}
```

---

### MODULE 9: Blog & SEO
**Current Status**: Complete blog page visual templates and headers are ready. SEO Panel editor UI works and reads/saves to `store/designStore.ts`. Inline HTML headers inject meta/OG values during static export.
* **Frontend Work**:
  * Build dashboard blog management interface at `/dashboard/blog`.
  * Integrate a rich text editor (e.g. Slate.js or Tiptap) for blog content creation.
  * Link canvas blog post listings component to fetch real backend posts.
* **Backend APIs Required**:
  * `GET /api/projects/:id/posts` — Get blog articles.
  * `POST /api/projects/:id/posts` — Create new blog article.
  * `PUT /api/projects/:id/posts/:postId` — Update blog article.
  * `DELETE /api/projects/:id/posts/:postId` — Delete blog article.

#### API Contracts for Backend Team:
```json
// POST /api/projects/:id/posts
// Headers: Authorization: Bearer <token>
// Body:
{
  "title": "My First Blog Post",
  "summary": "Introduction to Stackly builder",
  "content": "<p>Stackly is a drag-and-drop builder...</p>",
  "category": "Design",
  "featuredImage": "https://stackly-assets.s3.amazonaws.com/blog-hero.png",
  "status": "published"
}
// Response (201):
{
  "success": true,
  "post": {
    "id": "post_7788",
    "title": "My First Blog Post",
    "slug": "my-first-blog-post",
    "publishedAt": "2026-06-29T18:00:00.000Z"
  }
}
```

---

### MODULE 10: Analytics Dashboard
**Current Status**: Analytics page UI, metrics KPI cards, Top Pages list, views, and visitor charts are complete. Data is currently simulated via a `seedDemoAnalytics()` helper stored in `localStorage`.
* **Frontend Work**:
  * Replace demo seeder with actual API request using filters (`?filter=7days`/`?filter=30days`).
  * Embed lightweight tracking snippet during HTML publishing page compile step.
* **Backend APIs Required**:
  * `POST /api/analytics/events` — Track visitor views (device, geo, page URL, session).
  * `GET /api/projects/:id/analytics` — Return summarized and aggregate views/visitors stats.

#### API Contracts for Backend Team:
```json
// GET /api/projects/:id/analytics?filter=7days
// Headers: Authorization: Bearer <token>
// Response (200):
{
  "success": true,
  "views": 15020,
  "visitors": 4200,
  "dailyStats": [
    { "date": "2026-06-23", "views": 2100, "visitors": 600 },
    { "date": "2026-06-24", "views": 1900, "visitors": 550 }
  ],
  "topPages": [
    { "path": "/", "views": 11200 },
    { "path": "/about", "views": 2500 }
  ]
}
```

---

### MODULE 11: AI Content Assistant
**Current Status**: AI prompt descriptions and example outputs are integrated into block specifications but not connected to a remote LLM API.
* **Frontend Work**:
  * Build "Generate with AI" button and prompt entry popover in `PropertyEditor.tsx` content fields.
  * Build AI image prompt field inside `AssetManager.tsx` sidebar.
  * Add layout prompt suggestion action wizard.
* **Backend APIs Required**:
  * `POST /api/ai/generate-text` — Generate copy from context description.
  * `POST /api/ai/generate-image` — Generate image using DALL-E or Midjourney wrapper.
  * `POST /api/ai/suggest-layout` — Return complete JSON layout specification matching theme tags.

#### API Contracts for Backend Team:
```json
// POST /api/ai/generate-text
// Headers: Authorization: Bearer <token>
// Body:
{
  "prompt": "Write a professional headline for a fitness studio landing page",
  "context": "FitLife studio focus on cardio and yoga"
}
// Response (200):
{
  "success": true,
  "text": "Elevate Your Limits: Elite Cardio & Restorative Yoga at FitLife"
}
```

---

## 🚀 Execution Strategy for Frontend Team

To execute this plan smoothly, proceed in the following order as backend APIs become available:

1. **Authentication Interceptor & Route Guards**: Wire `useAuth` hook and setup interceptors on fetch requests to check token expiration.
2. **Dashboard Data Connection**: Swap `localStorage` calls with standard `projectApi` functions.
3. **Asset S3 Uploader**: Update asset drag-drop handler to post files to `/api/assets/upload`.
4. **Deploy & Rollbacks**: Code the deployment list UI and wire "Publish" actions.
5. **Analytics & Add-ons**: Connect analytics cards to live aggregator queries, and implement gates on paid modules (such as Custom Domains).
