# Phase 1 & 2 — Backend Architecture Discovery Report

> **Goal**: Consolidate `test/backend/` (Backend A) and `test/WBA_BACKEND/` (Backend B) into **one production-ready backend**.  
> **Source of Truth**: [stackly_project_context.md](file:///d:/stackly/Workplace/Website-Builder-Application/stackly_project_context.md)  
> **Phase**: Discovery only — **NO code changes have been made.**

---

## Phase 1 — Structure Mapping (Complete File-Level Inventory)

### Backend A (Your Backend): `test/backend/`

**Architecture**: Layered MVC + Service — clean separation of concerns.  
**Total**: 72 source files | 3 scripts | 4 docs

```
test/backend/
│
├── server.js ────────────────── (391 B)  Entry point — loads .env, calls connectDB(), starts Express
├── package.json ─────────────── (834 B)  "stackly-backend" v1.0.0 | Node >=20 <25 | 14 dependencies
├── .env.example ─────────────── (1.7 KB) 67-line env template (all vars documented with placeholders)
├── BACKEND_SETUP_GUIDE.md ──── (6.4 KB) Full setup docs: prerequisites, env vars, seed, troubleshooting
│
├── docs/
│   ├── API.md ───────────────── (3.0 KB) API overview
│   ├── API_DOCUMENTATION.md ── (7.4 KB) Full API reference (all endpoints)
│   ├── POSTMAN_COLLECTION.json (5.2 KB) Postman v2.1 collection
│   └── stackly-api.postman_collection.json (10.6 KB) Extended Postman collection
│
├── scripts/
│   ├── seed-templates.js ────── (678 B)  Seeds 5 base templates into MongoDB
│   ├── seed-store.js ────────── (2.9 KB) Creates demo storefront + 10 products
│   └── send-test-email.js ──── (658 B)  Validates SMTP config by sending test email
│
└── src/
    ├── app.js ───────────────── (3.3 KB) Express app: CORS config, passport init, 14 route mounts,
    │                                      error handlers. Webhook route before JSON parser.
    │
    ├── config/
    │   ├── db.js ────────────── (980 B)  MongoDB connection with DNS override + retry + runtime error listener
    │   ├── email.js ─────────── (1.1 KB) Nodemailer transporter factory (lazy init, SMTP config from env)
    │   └── passport.js ──────── (1.9 KB) Google OAuth strategy (conditional init, upsert user, serialize/deserialize)
    │
    ├── controllers/                        ── All are THIN wrappers calling service functions ──
    │   ├── authController.js ── (2.6 KB) register, login, forgotPassword, sendEmailOtp, sendMobileOtp,
    │   │                                  verifyEmail, verifyMobile, resetPassword, refresh, googleCallback
    │   ├── userController.js ── (419 B)  getProfile → returns req.user
    │   ├── workspaceController.js (2.3 KB) create, list, getById, update, delete, duplicate, updateComponents,
    │   │                                   updateDesignTokens, autosave
    │   ├── templateController.js (2.3 KB) list, getById, useTemplate, getCart, addToCart, removeFromCart,
    │   │                                   getWishlist, addToWishlist, removeFromWishlist
    │   ├── blogController.js ── (1.4 KB) create, list, getBySlug, update, delete
    │   ├── paymentController.js (1.3 KB) createSubscription, stripeWebhook
    │   ├── ecommerceController.js (2.7 KB) createProduct, listProducts, getProduct, updateProduct, deleteProduct
    │   ├── cartController.js ── (1.4 KB) getCart, addToCart, updateQuantity, removeFromCart, clearCart
    │   ├── wishlistController.js (810 B) getWishlist, toggleWishlist
    │   ├── checkoutController.js (908 B) createOrder, verifyPayment
    │   ├── analyticsController.js (560 B) trackEvent, getDashboard
    │   ├── domainController.js  (1.0 KB) setSubdomain, setCustomDomain, verifyDomain
    │   └── publishController.js (1.1 KB) publish, listDeployments, rollback
    │
    ├── middleware/
    │   ├── auth.js ──────────── (960 B)  JWT auth — verifies token, loads full User doc from DB, attaches req.user
    │   ├── optionalAuth.js ──── (599 B)  Same as auth but silently passes if no token
    │   ├── requirePlan.js ───── (1.1 KB) Feature gate — variadic plan list, admin bypass, checks subscriptionStatus
    │   ├── requirePremium.js ── (294 B)  Shortcut: plan=premium && status=active only
    │   ├── validate.js ──────── (371 B)  express-validator result → ApiError (collects all error messages)
    │   ├── errorHandler.js ──── (597 B)  notFound() + errorHandler() — statusCode, message, errors[], stack (dev only)
    │   └── requestLogger.js ─── (755 B)  Logs every request: method, path, status, duration_ms. Warns if >300ms
    │
    ├── models/                             ── All use mongoose.Schema with timestamps ──
    │   ├── User.js ──────────── (2.3 KB) 104 lines | name, email, mobile, password(select:false), avatar,
    │   │                                  authProvider(local|google), googleId, role(user|admin),
    │   │                                  plan(free|basic|business|advanced|premium), subscriptionStatus,
    │   │                                  stripeCustomerId, isEmailVerified, isMobileVerified,
    │   │                                  resetPasswordToken, resetPasswordExpiry
    │   │                                  Hooks: pre-save bcrypt hash | Methods: comparePassword(), toJSON()
    │   ├── Otp.js ───────────── (733 B)  40 lines | contact, channel(email|mobile), otp, attempts, maxAttempts(3),
    │   │                                  expiresAt(TTL index) | Index: {contact, channel}
    │   ├── Workspace.js ─────── (1.5 KB) 74 lines | userId(ref:User), projectName, category, style, sections[],
    │   │                                  description, thumbnail, status(active|archived|deleted),
    │   │                                  settings{domain, seo{title,desc,keywords}, visibility},
    │   │                                  components(Mixed), designTokens(Mixed)
    │   │                                  Index: {userId, status, updatedAt}
    │   ├── WorkspaceState.js ── (504 B)  25 lines | workspaceId(unique ref), pageData(Mixed), builderData(Mixed)
    │   ├── Template.js ──────── (1.4 KB) 75 lines | name, slug(unique), category(enum:5), description, thumbnail,
    │   │                                  previewUrl, components(Mixed), designTokens(Mixed), sections[],
    │   │                                  style, tags[], featured(bool), usageCount, premium(bool), price
    │   │                                  Index: {category, featured}
    │   ├── TemplateCart.js ──── (640 B)  27 lines | userId(ref:User), templateId(ref:Template)
    │   │                                  Index: {userId, templateId} unique | {userId, createdAt}
    │   ├── TemplateWishlist.js  (671 B)  27 lines | userId(ref:User), templateId(ref:Template)
    │   │                                  Index: {userId, templateId} unique | {userId, createdAt}
    │   ├── BlogPost.js ──────── (1.5 KB) 68 lines | workspaceId(ref:Workspace), author(ref:User), title, slug,
    │   │                                  content(Mixed), excerpt, coverImage, category, tags[], status(draft|
    │   │                                  published|archived), seo{title,desc,keywords}, publishedAt
    │   │                                  Index: {workspaceId, slug} unique | {workspaceId, status, publishedAt}
    │   ├── Subscription.js ──── (1.2 KB) 56 lines | userId(ref:User), plan(enum:5), paymentProvider(stripe|razorpay),
    │   │                                  paymentStatus(pending|completed|failed|refunded), subscriptionId,
    │   │                                  orderId, amount, currency(INR), startDate, expiryDate
    │   │                                  Index: {userId, createdAt} | {orderId} sparse | {subscriptionId} sparse
    │   ├── Product.js ─────────  (1.6 KB) 84 lines | workspaceId(ref:Workspace), userId(ref:User), name, slug,
    │   │                                  description, price, currency(INR), images[], category, inventory,
    │   │                                  status(active|draft|archived), salePrice, sku, variants(Mixed), options(Mixed)
    │   │                                  Index: {workspaceId, slug} unique | {workspaceId, status, updatedAt}
    │   ├── Order.js ─────────── (2.2 KB) 116 lines | workspaceId, userId, items[{productId, name, price, quantity}],
    │   │                                  subtotal, tax, shippingCost, totalAmount, currency, paymentProvider,
    │   │                                  razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentStatus,
    │   │                                  paymentId, shippingAddress(Mixed), billingDetails(Mixed), status(6 enums),
    │   │                                  customerEmail, customerName, orderNotes
    │   │                                  Index: {workspaceId, createdAt} | {userId, createdAt}
    │   ├── Cart.js ──────────── (829 B)  44 lines | userId(ref:User), workspaceId(ref:Workspace),
    │   │                                  items[{productId, quantity, addedAt}]
    │   │                                  Index: {userId, workspaceId} unique
    │   ├── Wishlist.js ──────── (636 B)  31 lines | userId, workspaceId, products[ref:Product]
    │   │                                  Index: {userId, workspaceId} unique
    │   ├── Domain.js ────────── (1.0 KB) 52 lines | workspaceId, userId, subdomain(unique sparse), customDomain,
    │   │                                  dnsVerified(bool), sslStatus(none|pending|active|failed), status
    │   │                                  Index: {customDomain} sparse
    │   ├── Deployment.js ────── (1.1 KB) 53 lines | workspaceId, userId, version, status(pending|building|deployed|
    │   │                                  failed|rolled_back), htmlSnapshot, assetsManifest(Mixed), s3Url,
    │   │                                  deployedAt, metadata(Mixed)
    │   │                                  Index: {workspaceId, version} | {workspaceId, status}
    │   └── AnalyticsEvent.js ── (1.0 KB) 51 lines | workspaceId, eventType(page_view|click|form_submit|scroll|custom),
    │                                      path, referrer, userAgent, ip, sessionId, metadata(Mixed), timestamp
    │                                      Index: {workspaceId, timestamp} | {workspaceId, eventType, timestamp}
    │
    ├── routes/                             ── Express Router files ──
    │   ├── authRoutes.js ────── (1.4 KB) POST register, login, forgot-password, send-email-otp, send-mobile-otp,
    │   │                                  verify-email, verify-mobile, reset-password, refresh-token
    │   │                                  GET google (redirect), google/callback (passport)
    │   ├── userRoutes.js ────── (512 B)  GET /me, PUT /me (authenticate)
    │   ├── workspaceRoutes.js ─ (1.3 KB) CRUD + duplicate, update-components, update-design-tokens, autosave
    │   ├── templateRoutes.js ── (1.2 KB) GET list/detail, POST use-template, cart CRUD, wishlist CRUD
    │   ├── blogRoutes.js ────── (666 B)  CRUD by workspaceId scope
    │   ├── paymentRoutes.js ─── (455 B)  POST create-subscription
    │   ├── razorpayRoutes.js ── (375 B)  POST create-order, verify
    │   ├── ecommerceRoutes.js ─ (1.1 KB) Product CRUD (workspace-scoped)
    │   ├── cartRoutes.js ────── (910 B)  GET, POST add, PUT quantity, DELETE remove, DELETE clear
    │   ├── wishlistRoutes.js ── (703 B)  GET, POST toggle
    │   ├── checkoutRoutes.js ── (893 B)  POST create-order, POST verify-payment
    │   ├── analyticsRoutes.js ─ (472 B)  POST track, GET dashboard
    │   ├── domainRoutes.js ──── (517 B)  POST subdomain, POST custom-domain, GET verify
    │   └── publishRoutes.js ─── (539 B)  POST publish, GET deployments, POST rollback
    │
    ├── services/                           ── Business logic layer (controllers call these) ──
    │   ├── authService.js ───── (8.5 KB) 265 lines | register, login, forgotPassword, sendEmailOtp, sendMobileOtp,
    │   │                                  verifyEmail, verifyMobile, resetPassword, refresh, googleCallback
    │   │                                  Helper: tokenPayload(), authResponse(), oauthRedirectUrl(), issueOtp()
    │   ├── emailService.js ──── (1.5 KB) sendOtpEmail() — uses Nodemailer or console fallback
    │   ├── smsService.js ────── (1.3 KB) sendSmsOtp() — Twilio / TextLocal / mock provider switch
    │   ├── userService.js ───── (446 B)  getProfile() — returns sanitized user
    │   ├── workspaceService.js  (5.0 KB) create, list(search/sort/paginate), getById, update, delete(soft),
    │   │                                  duplicate, updateComponents, updateDesignTokens, autosave
    │   ├── templateService.js ─ (7.6 KB) list(filter/paginate), getById, useTemplate(clone→workspace),
    │   │                                  cart CRUD (TemplateCart model), wishlist CRUD (TemplateWishlist model)
    │   ├── blogService.js ───── (4.6 KB) create(slug gen), list(filter/paginate), getBySlug, update, delete
    │   ├── paymentService.js ── (7.0 KB) createSubscription (Razorpay order + Subscription record + user plan update)
    │   ├── checkoutService.js ─ (10.2 KB) createOrder (e-commerce: cart→order, Razorpay order, inventory deduction),
    │   │                                   verifyPayment (HMAC verify, payment status update)
    │   ├── ecommerceService.js  (6.1 KB) Product CRUD with slug generation, workspace ownership validation
    │   ├── cartService.js ───── (4.1 KB) getCart(populate products), addToCart, updateQuantity, remove, clear
    │   ├── wishlistService.js ─ (1.8 KB) getWishlist, toggleWishlist
    │   ├── analyticsService.js  (2.3 KB) trackEvent (create AnalyticsEvent), getDashboard (aggregate stats)
    │   ├── domainService.js ─── (3.2 KB) setSubdomain, setCustomDomain, verifyDomain
    │   └── publishService.js ── (4.1 KB) publish (create Deployment, generate HTML snapshot),
    │                                      listDeployments, rollback
    │
    ├── utils/
    │   ├── ApiError.js ──────── (963 B)  43 lines | Custom error class with isOperational flag
    │   │                                  Static factories: badRequest(400), unauthorized(401), forbidden(403),
    │   │                                  notFound(404), conflict(409), tooMany(429), internal(500)
    │   ├── jwt.js ───────────── (1.1 KB) 49 lines | signAccessToken, signRefreshToken, verifyAccessToken,
    │   │                                  verifyRefreshToken, signResetToken(15min)
    │   ├── logger.js ────────── (1.6 KB) 63 lines | Structured logger (JSON in prod, human-readable in dev)
    │   │                                  Methods: info, warn, error, debug, startTimer()
    │   └── helpers.js ─────────  (653 B)  29 lines | generateOtp(length), sanitizeUser(strip password/tokens)
    │
    └── validations/
        ├── authValidation.js ── (3.3 KB) express-validator chains for register, login, forgot, verify, reset
        ├── userValidation.js ── (547 B)  express-validator chain for profile update
        └── workspaceValidation.js (1.4 KB) express-validator chains for create, update workspace

```

**File Count Summary (Backend A)**:

| Layer | Count | Total Size |
|-------|-------|------------|
| Root files | 4 | 9.5 KB |
| docs/ | 4 | 26.2 KB |
| scripts/ | 3 | 4.3 KB |
| src/config/ | 3 | 4.0 KB |
| src/controllers/ | 13 | 19.5 KB |
| src/middleware/ | 7 | 5.6 KB |
| src/models/ | 16 | 20.3 KB |
| src/routes/ | 14 | 11.3 KB |
| src/services/ | 15 | 68.2 KB |
| src/utils/ | 4 | 4.3 KB |
| src/validations/ | 3 | 5.2 KB |
| **TOTAL** | **86** | **~178 KB** |

---

### Backend B (Team Backend): `test/WBA_BACKEND/`

**Architecture**: Flat MVC — controller-heavy, no service layer, business logic mixed into controllers.  
**Total**: 31 source files | 30 static assets | 1 stale backup directory

```
test/WBA_BACKEND/
│
├── server.js ────────────────── (1.9 KB) 82 lines | Monolithic entry point — dotenv, express, session, cors(*),
│                                         passport init, 8 route mounts, inline 404 handler, app.listen()
├── package.json ─────────────── (683 B)  "website-builder-backend" v1.0.0 | Express 5.2.1 | 12 deps + nodemon
├── .env ─────────────────────── (558 B)  ⚠️ COMMITTED WITH REAL CREDENTIALS
│                                         PORT, MONGO_URI(local), JWT_SECRET, Google OAuth keys,
│                                         Razorpay test keys, AWS region + bucket + placeholder keys
│
├── config/
│   ├── db.js ────────────────── (278 B)  13 lines | Simple mongoose.connect(MONGO_URI) — no retry, no DNS override
│   ├── passport.js ──────────── (1.6 KB) 67 lines | Google OAuth strategy — console.logs secrets (!), creates user
│   │                                      with password="GOOGLE_AUTH_USER" (!), session serialization commented out
│   ├── razorpay.js ──────────── (340 B)  22 lines | Creates Razorpay instance — console.logs KEY and SECRET (!)
│   ├── s3.js ────────────────── (274 B)  11 lines | AWS S3Client with region + credentials from env
│   └── plans.js ─────────────── (266 B)  26 lines | Plan pricing: BASIC(₹4000), BUSINESS(₹15000), ADVANCED(₹28000)
│
├── controllers/
│   ├── authController.js ───── (29.8 KB) 1135 lines (!) | MONOLITHIC — contains ALL auth logic:
│   │                                      register (263 lines — inline name/email/mobile/password validation,
│   │                                        domain whitelist, country code parsing, repeated digit rejection),
│   │                                      login (117 lines — primary + alternate credential lookup),
│   │                                      forgotPassword (277 lines — normal mode + Change Mode for
│   │                                        alternate credential management with type/duplicate/limit checks),
│   │                                      verifyOtpByEmail (136 lines — verify + resend + attempts tracking),
│   │                                      verifyOtpByMobile (143 lines — same pattern as email),
│   │                                      resetPassword (187 lines — token validation, password complexity,
│   │                                        last-3 reuse check, password history $push, alternate save on reset)
│   ├── blogController.js ──── (7.5 KB)  374 lines | createBlog (S3 image upload, slugify, SEO+OG fields),
│   │                                      getBlogs (pagination, search, status filter, sort),
│   │                                      getBlogBySlug, updateBlog (partial update, S3 image, sitemap regen),
│   │                                      publishBlog (status→published, sitemap regen), deleteBlog
│   ├── projectController.js ─ (5.3 KB)  280 lines | createProject, getProjects (all — no user filter!),
│   │                                      getProjectById, updateProject, deleteProject, autoSaveProject
│   │                                      (builderData + projectName sync + htmlContent), duplicateProject,
│   │                                      updateThumbnail, saveHtmlProject
│   ├── paymentController.js ─ (2.8 KB)  125 lines | createOrder (Razorpay inline), verifyPayment (HMAC verify,
│   │                                      fetch payment details, save Payment model with card/UPI/wallet info)
│   ├── templateController.js  (1.2 KB)  91 lines | uploadTemplate (S3 upload via s3UploadService),
│   │                                      getTemplates (sorted by createdAt desc)
│   ├── categoryController.js  (278 B)   12 lines | getCategories (Category.find())
│   └── sitemapController.js ─ (313 B)   13 lines | getSitemap → generateSitemap() → XML response
│
├── middleware/
│   ├── authMiddleware.js ──── (433 B)   21 lines | JWT verify — attaches decoded payload only (not full user doc)
│   │                                      Returns 401 "No token" or 400 "Invalid token"
│   └── upload.js ─────────── (207 B)    12 lines | multer memoryStorage, 5MB file size limit
│
├── models/
│   ├── User.js ──────────────── (880 B)  47 lines | name, email(unique), mobile(unique sparse), password,
│   │                                      mobileDigits, nationalNumber, passwordHistory[], pendingAlternate,
│   │                                      alternates[], otp, otpExpiry, otpAttempts
│   │                                      ⚠️ No pre-save hash hook, no password select:false, no toJSON()
│   ├── Blog.js ──────────────── (1.2 KB) 79 lines | title, slug(unique), content(String), author(ref:User),
│   │                                      seoTitle, seoDescription, seoKeywords[], ogTitle, ogDescription,
│   │                                      ogImage, ogType, twitterCard, canonicalUrl, featuredImage,
│   │                                      status(draft|published)
│   │                                      Index: {status} | {createdAt} | {title: "text"}
│   ├── project.js ───────────── (747 B)  58 lines | userId(ref:User), projectName, description, templateId,
│   │                                      thumbnail, builderData(Mixed), htmlContent, status(default:"draft")
│   │                                      ⚠️ No compound indexes, no category/style/sections/designTokens
│   ├── Template.js ──────────── (392 B)  25 lines | title, category, imageUrl — all required
│   │                                      ⚠️ No slug, no components, no designTokens, no premium/price
│   ├── Category.js ──────────── (273 B)  10 lines | name(required), image, description
│   ├── Payment.js ───────────── (934 B)  47 lines | userId(ref:User), customerName, customerEmail, customerMobile,
│   │                                      paymentMethod, wallet, upiId, bank, planName, amount,
│   │                                      cardLast4, cardNetwork, cardIssuer, cardType,
│   │                                      razorpay_order_id, razorpay_payment_id, razorpay_signature, status
│   │                                      ⚠️ Has console.log debug statements in model file (!)
│   ├── Subscription.js ──────── (392 B)  27 lines | userId(String — not ObjectId!), planName, amount,
│   │                                      startDate, expiryDate, status(default:"Active")
│   │                                      ⚠️ userId is String not ObjectId, no paymentProvider, no indexes
│   └── Invoice.js ───────────── (374 B)  28 lines | invoiceId, userId(String), paymentId, amount, gst, total, status
│                                          ⚠️ userId is String not ObjectId
│
├── routes/
│   ├── authRoutes.js ─────────  (2.1 KB) 95 lines | POST register, login, forgot-password, verify-email-otp,
│   │                                      verify-mobile-otp, reset-password | GET profile (auth protected)
│   │                                      GET /google (passport redirect) | GET /google/callback (token→redirect)
│   │                                      ⚠️ Hardcoded redirect URLs (http://localhost:3000)
│   ├── projectRoutes.js ────── (807 B)  34 lines | GET /, GET /:id, PUT /:id, DELETE /:id,
│   │                                      PUT /:id/autosave, POST /:id/duplicate, PUT /:id/thumbnail,
│   │                                      PUT /:id/save-html, POST / (authMiddleware for create only)
│   │                                      ⚠️ GET/PUT/DELETE routes have NO auth middleware (!)
│   ├── blogRoutes.js ─────────  (590 B)  27 lines | POST /create (multer upload), GET /, GET /:slug,
│   │                                      PUT /:id (multer upload), PATCH /:id/publish, DELETE /:id
│   │                                      ⚠️ No auth middleware on any blog route
│   ├── paymentRoutes.js ──────  (446 B)  29 lines | POST /create-order, POST /verify-payment, POST /verify
│   │                                      ⚠️ Duplicate route: /verify-payment AND /verify both call verifyPayment
│   ├── templateRoutes.js ─────  (365 B)  33 lines | POST /upload (multer), GET /
│   ├── categoryRoutes.js ────── (200 B)   8 lines | GET /
│   └── sitemapRoutes.js ──────  (218 B)  11 lines | GET /sitemap.xml
│
├── services/
│   ├── s3Service.js ──────────  (663 B)  26 lines | uploadImage() — sharp→WebP (quality:80) → S3 PutObject
│   │                                      Returns public S3 URL. Used for BLOG images. Bucket prefix: blogs/
│   ├── s3UploadService.js ──── (749 B)   29 lines | uploadImageToS3() — same as above but prefix: templates/
│   │                                      ⚠️ Near-identical duplicate of s3Service.js (only prefix differs)
│   ├── paymentService.js ───── (385 B)   22 lines | createRazorpayOrder(amount) — wraps razorpay.orders.create()
│   └── invoiceService.js ───── (676 B)   45 lines | generateInvoicePDF() — PDFKit: writes invoice to filesystem
│                                          Outputs: "STACKLY INVOICE" + invoiceId, amount, GST, total, status, date
│
├── utils/
│   ├── generateSitemap.js ──── (766 B)  37 lines | Queries published Blog docs → builds XML sitemap
│   │                                      Uses BASE_URL env var, includes lastmod/changefreq/priority
│   ├── verifySignature.js ──── (682 B)  37 lines | Razorpay HMAC-SHA256 signature verification
│   └── generateInvoiceID.js ── (167 B)  10 lines | Returns "INV-" + random 6-digit number
│
├── public/                              ← Static assets (logos, illustrations for auth pages)
│   ├── email.png ────────────── (20 KB)
│   ├── email.webp ───────────── (28 KB)
│   ├── illustration.png ─────── (95 KB)
│   ├── illustration.webp ────── (97 KB)
│   ├── illustration1.png ────── (31 KB)
│   ├── illustration1.webp ───── (11 KB)
│   ├── login.png ────────────── (95 KB)
│   ├── login.webp ───────────── (98 KB)
│   ├── login1.png ───────────── (35 KB)
│   ├── login1.webp ──────────── (14 KB)
│   ├── logoplan.png ─────────── (436 B)
│   ├── logoplan.webp ────────── (264 B)
│   ├── logoplan2.png ────────── (729 B)
│   ├── logoplan2.webp ─────────  (276 B)
│   ├── logoplan3.png ────────── (400 B)
│   ├── logoplan3.webp ─────────  (274 B)
│   ├── logoplan3-tmp.webp ───── (274 B)
│   ├── mobile.png ───────────── (2.7 KB)
│   ├── mobile.webp ──────────── (9.9 KB)
│   ├── new.png ──────────────── (217 KB)
│   ├── new.webp ─────────────── (93 KB)
│   ├── password.png ─────────── (39 KB)
│   ├── password.webp ────────── (93 KB)
│   ├── photo.png ────────────── (11 KB)
│   ├── photo.webp ───────────── (2.6 KB)
│   ├── stackly-logo.png ─────── (43 KB)
│   ├── stackly-logo.webp ────── (92 KB)
│   ├── stackly-logo1.png ────── (9.9 KB)
│   ├── tick.png ─────────────── (1.1 KB)
│   └── tick.webp ────────────── (8.2 KB)
│
└── WBA_Back - Copy/                    ← ⚠️ STALE BACKUP — full old backend with node_modules
    ├── server.js ────────────── (1.6 KB) Older version of server.js
    ├── package.json ─────────── (795 B)  Different dependency set
    ├── .env ─────────────────── (471 B)  Older credentials
    ├── config/ ──────────────── (same structure as parent)
    ├── controllers/ ─────────── (older versions)
    ├── middleware/ ───────────── (same)
    ├── models/ ──────────────── (older versions)
    ├── routes/ ──────────────── (older versions)
    ├── services/ ────────────── (older versions)
    ├── utils/ ───────────────── (older versions)
    ├── public/ ──────────────── (same static assets)
    ├── node_modules/ ────────── ⚠️ FULL node_modules committed
    ├── package-lock.json ────── (122 KB)
    └── tempCodeRunnerFile.js ── (991 B)  ⚠️ VS Code temp file left behind

```

**File Count Summary (Backend B)**:

| Layer | Count | Total Size |
|-------|-------|------------|
| Root files | 3 | 3.1 KB |
| config/ | 5 | 2.8 KB |
| controllers/ | 7 | 47.4 KB |
| middleware/ | 2 | 640 B |
| models/ | 8 | 5.0 KB |
| routes/ | 7 | 4.7 KB |
| services/ | 4 | 2.5 KB |
| utils/ | 3 | 1.6 KB |
| public/ | 30 | ~1.2 MB |
| WBA_Back - Copy/ | ~20+ | ⚠️ stale duplicate |
| **TOTAL (excl. backup)** | **69** | **~1.3 MB** (including static assets) |
| **Source files only** | **39** | **~67 KB** |

---

## Phase 2 — Full Inventory & Comparative Analysis

### 2.1 — Entry Point & Server Setup

| Aspect | Backend A | Backend B | Winner |
|--------|-----------|-----------|--------|
| Entry file | `server.js` → `src/app.js` (separated) | `server.js` (monolithic) | **A** — cleaner separation |
| Express version | `express@4.21.2` | `express@5.2.1` | ⚠️ **Conflict** — B uses Express 5 (breaking changes) |
| CORS | Dynamic allowlist from env + preflight handler | `origin: "*"` (wide open) | **A** — production-safe |
| Body parser | `express.json({ limit: '2mb' })` | `express.json()` (default 100kb) | **A** |
| Session | None (stateless JWT) | `express-session` with hardcoded secret | **A** — no sessions needed |
| Passport | Lazy init, conditional Google strategy | Always loads, debug `console.log` of secrets | **A** |
| Health check | `GET /health → { ok, service }` | `GET / → "API is running..."` | **A** |
| Error handling | `ApiError` class + `notFound` + `errorHandler` middleware | Inline `404 handler` (no stack/detail) | **A** |
| Logging | Structured logger (JSON prod, human dev) + request timer | `console.log` everywhere | **A** |
| `.env` | `.env.example` (67 vars, documented) | `.env` committed with **real credentials** | **A** — B is a security risk |

---

### 2.2 — Authentication Module

| Feature | Backend A | Backend B | Analysis |
|---------|-----------|-----------|----------|
| Register | `authService.register()` — hashing via schema pre-save hook | `authController.register()` — inline `bcrypt.hash()` with extensive manual validation (1135-line controller!) | A: clean service layer. **B: has richer validation** (name format, domain whitelist, mobile country code, repeated digits rejection) |
| Login | `authService.login()` — email or mobile | `authController.login()` — email or mobile + **alternate login** support | **B: has alternate credential login** (unique feature) |
| Forgot Password | `authService.forgotPassword()` — issues OTP to email or mobile | `authController.forgotPassword()` — forgot password + **Change Mode** (add alternate email/mobile with OTP verification) | **B: has alternate credential management** (unique feature) |
| OTP verification | Separate `Otp` model with TTL index, max 3 attempts | Inline OTP fields on `User` model (`otp`, `otpExpiry`, `otpAttempts`) | **A: better architecture** (decoupled Otp model), but B works |
| Password reset | `authService.resetPassword()` — uses reset token with `purpose` claim | `authController.resetPassword()` — reuse check against last 3 passwords (`passwordHistory`) | **B: has password history** (unique feature) |
| JWT | Separate access + refresh tokens, `sub` claim | Single token, `userId` claim, no refresh token | **A: production-ready** JWT implementation |
| Google OAuth | `authService.googleCallback()` — code exchange flow via axios | `passport.authenticate('google')` — Passport strategy with hardcoded redirect URLs | **A: more flexible**, both work |
| Token payload | `{ sub: userId, role }` | `{ userId }` | **A** — includes role |

> [!IMPORTANT]
> **Backend B Unique Features to Preserve:**
> 1. Alternate email/mobile credential management (`alternates`, `pendingAlternate`)
> 2. Password history and reuse prevention (`passwordHistory`)
> 3. Rich input validation (domain whitelist, mobile country code, repeated digit rejection)
> 4. Alternate credential login flow

---

### 2.3 — Models Comparison

| Model | Backend A | Backend B | Notes |
|-------|-----------|-----------|-------|
| **User** | 104 lines — `name, email, mobile, password(select:false), avatar, authProvider, googleId, role, plan, subscriptionStatus, stripeCustomerId, isEmailVerified, isMobileVerified, resetPasswordToken, resetPasswordExpiry` + pre-save hash + `comparePassword()` + `toJSON()` | 47 lines — `name, email, mobile, password, mobileDigits, nationalNumber, passwordHistory, pendingAlternate, alternates, otp, otpExpiry, otpAttempts` | ⚠️ **MERGE** — A has better structure, B has unique fields |
| **Otp** | ✅ Dedicated model (TTL index, attempts) | ❌ None (inline on User) | **A wins** — keep separate model |
| **Workspace** | ✅ Full schema (74 lines) — `userId, projectName, category, style, sections, description, thumbnail, status, settings{domain, seo, visibility}, components, designTokens` + compound indexes | ❌ None | **A only** |
| **WorkspaceState** | ✅ Separate state doc — `workspaceId, pageData, builderData` | ❌ None | **A only** |
| **Project** | ❌ None (uses "Workspace" concept) | ✅ `project.js` — `userId, projectName, description, templateId, thumbnail, builderData, htmlContent, status` | ⚠️ B's "Project" = A's "Workspace". **A is more complete** |
| **Template** | ✅ Rich schema (75 lines) — `name, slug, category, description, thumbnail, previewUrl, components, designTokens, sections, style, tags, featured, usageCount, premium, price` | ✅ Minimal (25 lines) — `title, category, imageUrl` | **A wins** — far more complete |
| **BlogPost** | ✅ Full schema (68 lines) — `workspaceId, author, title, slug, content(Mixed), excerpt, coverImage, category, tags, status, seo, publishedAt` + unique slug/workspace index | ❌ None | **A only** |
| **Blog** | ❌ None | ✅ (79 lines) — `title, slug, content(String), author, seoTitle, seoDescription, seoKeywords, ogTitle, ogDescription, ogImage, ogType, twitterCard, canonicalUrl, featuredImage, status` + text index | ⚠️ **Both exist** — B's Blog has richer SEO/OG fields, A's BlogPost has workspace scoping |
| **Category** | ❌ None | ✅ `name, image, description` | **B only** — needed for template categories |
| **Subscription** | ✅ Full schema — `userId, plan, paymentProvider, paymentStatus, subscriptionId, orderId, amount, currency, startDate, expiryDate` + indexes | ✅ Minimal — `userId(String!), planName, amount, startDate, expiryDate, status` | **A wins** — proper ObjectId refs, richer schema |
| **Payment** | ❌ None (handled in service layer) | ✅ `Payment.js` — `userId, customerName, customerEmail, customerMobile, paymentMethod, wallet, upiId, bank, planName, amount, cardLast4, cardNetwork, cardIssuer, cardType, razorpay_*` | **B only** — detailed payment record (unique) |
| **Invoice** | ❌ None | ✅ `invoiceId, userId, paymentId, amount, gst, total, status` | **B only** — needed for billing |
| **Product** | ✅ Full schema (84 lines) — `workspaceId, userId, name, slug, description, price, currency, images, category, inventory, status, salePrice, sku, variants, options` | ❌ None | **A only** |
| **Order** | ✅ Full schema (116 lines) — embedded `orderItems`, subtotal, tax, shipping, razorpay fields, shipping/billing addresses | ❌ None | **A only** |
| **Cart** | ✅ `userId, workspaceId, items[{productId, quantity}]` | ❌ None | **A only** |
| **Wishlist** | ✅ `userId, workspaceId, products[]` | ❌ None | **A only** |
| **TemplateCart** | ✅ `userId, templateId` | ❌ None | **A only** |
| **TemplateWishlist** | ✅ `userId, templateId` | ❌ None | **A only** |
| **Domain** | ✅ Full schema — `workspaceId, userId, subdomain, customDomain, dnsVerified, sslStatus, status` | ❌ None | **A only** |
| **Deployment** | ✅ Full schema — `workspaceId, userId, version, status, htmlSnapshot, assetsManifest, s3Url, deployedAt, metadata` | ❌ None | **A only** |
| **AnalyticsEvent** | ✅ Full schema — `workspaceId, eventType, path, referrer, userAgent, ip, sessionId, metadata, timestamp` | ❌ None | **A only** |

**Summary**: Backend A has **16 models**. Backend B has **7 models**. Only `User`, `Template`, `Blog`, and `Subscription` overlap with conflicts.

---

### 2.4 — Controllers & Routes

| Module | Backend A Routes | Backend B Routes | Notes |
|--------|------------------|------------------|-------|
| Auth | `/api/auth/*` (14 routes) | `/api/auth/*` (8 routes) | Both cover core auth. B adds alternate management |
| User/Profile | `/api/user/*` | ❌ (inline in auth) | A only |
| Workspace/Project | `/api/workspace/*` | `/api/projects/*` | ⚠️ **Different naming** — A="workspace", B="project" |
| Payment | `/api/payment/*` + `/api/razorpay/*` | `/api/payment/*` + `/api/razorpay/*` | Both exist. B has more detailed payment recording |
| Template | `/api/template/*` | `/api/templates/*` | ⚠️ **Singular vs plural** naming |
| Blog | `/api/blog/*` | `/api/blogs/*` | ⚠️ **Singular vs plural**. B has S3 image upload + sitemap |
| Analytics | `/api/analytics/*` | ❌ | A only |
| Domain | `/api/domain/*` | ❌ | A only |
| Publish | `/api/publish/*` | ❌ | A only |
| E-commerce | `/api/ecommerce/*` + `/api/cart/*` + `/api/wishlist/*` + `/api/checkout/*` | ❌ | A only |
| Category | ❌ | `/api/categories/*` | B only |
| Sitemap | ❌ | `/sitemap.xml` | B only |

---

### 2.5 — Services / Business Logic

| Service | Backend A | Backend B | Notes |
|---------|-----------|-----------|-------|
| Auth | `authService.js` (265 lines) — clean service functions | Inline in controller (1135 lines!) | **A** — proper service layer |
| Email | `emailService.js` + `config/email.js` | ❌ (commented out nodemailer import) | **A** — working email delivery |
| SMS | `smsService.js` (Twilio/TextLocal/mock) | ❌ | **A only** |
| Payment | `paymentService.js` (7KB) | `paymentService.js` (385 bytes) — tiny wrapper | **A** — far more complete |
| Checkout | `checkoutService.js` (10KB) | ❌ | **A only** |
| S3 Upload | ❌ | `s3Service.js` + `s3UploadService.js` — sharp WebP conversion + S3 PutObject | **B only** — needed for image uploads |
| Invoice PDF | ❌ | `invoiceService.js` — PDFKit-based invoice generation | **B only** — needed for billing |
| Blog | `blogService.js` (4.6KB) | Inline in controller | **A** |
| Workspace | `workspaceService.js` (5KB) | Inline in controller | **A** |
| Template | `templateService.js` (7.6KB) | Inline in controller | **A** |
| Sitemap | ❌ | `generateSitemap.js` — XML sitemap from published blogs | **B only** — needed for SEO |

---

### 2.6 — Middleware

| Middleware | Backend A | Backend B | Notes |
|-----------|-----------|-----------|-------|
| JWT Auth | `auth.js` — verifies token, loads user from DB, attaches `req.user` (full Mongoose doc) | `authMiddleware.js` — verifies token, attaches `req.user = decoded` (just JWT payload) | **A** — richer user context |
| Optional Auth | `optionalAuth.js` | ❌ | **A only** |
| Plan Gating | `requirePlan.js` (variadic plans) + `requirePremium.js` | ❌ | **A only** |
| Validation | `validate.js` (express-validator) | ❌ (all inline) | **A only** |
| Error Handler | `errorHandler.js` (structured, env-aware) | ❌ (inline 404) | **A only** |
| Request Logger | `requestLogger.js` (timing, slow request detection) | ❌ | **A only** |
| File Upload | ❌ | `upload.js` (multer, 5MB limit) | **B only** |

---

### 2.7 — Utilities

| Utility | Backend A | Backend B | Notes |
|---------|-----------|-----------|-------|
| Error class | `ApiError.js` — factory methods (400-500) | ❌ | **A only** |
| JWT | `jwt.js` — sign/verify access/refresh/reset tokens | ❌ (inline `jwt.sign/verify`) | **A** |
| Logger | `logger.js` — structured logging, timer utility | ❌ | **A only** |
| Helpers | `helpers.js` — `generateOtp()`, `sanitizeUser()` | ❌ | **A only** |
| Verify Signature | ❌ | `verifySignature.js` — Razorpay HMAC verification | **B only** |
| Invoice ID | ❌ | `generateInvoiceID.js` — random invoice ID | **B only** |
| Sitemap Gen | ❌ | `generateSitemap.js` — XML from Blog docs | **B only** |

---

### 2.8 — Dependencies

| Package | Backend A | Backend B | Notes |
|---------|-----------|-----------|-------|
| express | `4.21.2` | `5.2.1` | ⚠️ **MAJOR CONFLICT** — Express 5 has breaking changes |
| mongoose | `8.9.5` | `9.4.1` | ⚠️ Mongoose 9 has breaking changes |
| bcryptjs | `2.4.3` | `3.0.3` | Minor — both work |
| jsonwebtoken | `9.0.2` | `9.0.3` | Compatible |
| nodemailer | `6.9.16` | `8.0.5` | Use A's (stable) |
| passport | `0.7.0` | `0.7.0` | Same |
| razorpay | `2.9.6` | `2.9.6` | Same |
| cors | `2.8.5` | `2.8.6` | Compatible |
| dotenv | `16.4.7` | `17.4.2` | Compatible |
| axios | `1.18.0` | ❌ | A only — used for Google OAuth code exchange |
| express-validator | `7.2.1` | ❌ | A only |
| stripe | `17.5.0` | ❌ | A only |
| mongodb (driver) | `7.3.0` | ❌ | A only (for direct queries) |
| google-auth-library | ❌ | `10.6.2` | B only (not currently used in B's code) |
| express-session | ❌ | `1.19.0` | B only — **NOT NEEDED** (stateless JWT arch) |
| multer | ❌ | ❌ (in code but not in package.json!) | B uses it but it's missing from deps |
| sharp | ❌ | ❌ (in code but not in package.json!) | B uses it but it's missing from deps |
| @aws-sdk/client-s3 | ❌ | ❌ (in code but not in package.json!) | B uses it but it's missing from deps |
| slugify | ❌ | ❌ (in code but not in package.json!) | B uses it but it's missing from deps |
| pdfkit | ❌ | ❌ (in code but not in package.json!) | B uses it but it's missing from deps |
| nodemon | ❌ | `3.1.14` (devDep) | A uses `node --watch` instead |

> [!WARNING]
> **Backend B has 5 undeclared dependencies** (`multer`, `sharp`, `@aws-sdk/client-s3`, `slugify`, `pdfkit`) that are used in code but missing from `package.json`. These are likely installed in `node_modules` from a manual `npm install` but would fail on a clean install.

---

### 2.9 — Config & Environment

| Config Area | Backend A | Backend B |
|-------------|-----------|-----------|
| DB connection var | `MONGODB_URI` | `MONGO_URI` |
| DNS fallback | ✅ `MONGODB_DNS_SERVERS` | ❌ |
| JWT secrets | Access + Refresh + Reset (3 keys) | Single `JWT_SECRET` |
| Google OAuth | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (placeholder) | Real credentials in `.env` (**security risk**) |
| Razorpay | `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` + `RAZORPAY_MODE` | `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (real test keys exposed) |
| AWS | Commented out placeholder | Real keys (but placeholder values `xxxxxxxxxxxx`) |
| Email | Full SMTP config + delivery mode toggle | ❌ Not configured |
| SMS | Twilio + TextLocal + mock mode | ❌ |
| Stripe | ✅ `STRIPE_SECRET_KEY` etc. | ❌ |
| CORS | `CORS_ORIGINS` + `FRONTEND_URL` (env-based) | `origin: "*"` (hardcoded wide open) |

---

### 2.10 — Unique Features Exclusive to Each Backend

#### Only in Backend A (to keep as base):
- Service layer architecture (controllers are thin, logic in services)
- Structured error handling (`ApiError` class + middleware)
- Structured logging (`logger.js`)
- Request timing & slow request detection
- JWT refresh token rotation
- Optional auth middleware
- Plan-based feature gating (`requirePlan`, `requirePremium`)
- express-validator validation layer
- Comprehensive `.env.example` with 67 variables
- Setup documentation + Postman collections
- Seed scripts (templates, store, test email)
- 16 Mongoose models covering all modules
- E-commerce models (Product, Order, Cart, Wishlist)
- Domain & Deployment models
- Analytics model

#### Only in Backend B (must migrate into A):
1. **Password history & reuse prevention** — `passwordHistory` field, check against last 3
2. **Alternate email/mobile management** — `alternates`, `pendingAlternate` fields + CRUD logic
3. **S3 image upload** — `multer` + `sharp` WebP conversion + S3 PutObject (for blogs + templates)
4. **Payment recording model** — detailed card/UPI/wallet capture per transaction
5. **Invoice model & PDF generation** — PDFKit-based invoice builder
6. **Category model** — template categorization
7. **Sitemap generation** — XML sitemap from published blog posts
8. **Razorpay payment verification** — HMAC signature verification utility
9. **Project auto-save** — `PUT /:id/autosave` with `builderData` + `htmlContent`
10. **Project duplication** — `POST /:id/duplicate`
11. **Thumbnail update** — `PUT /:id/thumbnail`
12. **Save HTML** — `PUT /:id/save-html`
13. **Blog publish flow** — `PATCH /:id/publish` with sitemap regeneration
14. **Rich blog SEO fields** — `ogTitle`, `ogDescription`, `ogImage`, `ogType`, `twitterCard`, `canonicalUrl`
15. **Static public assets** — logos, illustrations (30 files)

---

## User Review Required

> [!IMPORTANT]
> ### Express Version Decision
> Backend A uses **Express 4.x**, Backend B uses **Express 5.x** (which has breaking changes including no `app.param()`, different error handling, and promise-based middleware). Since Backend A is the base and has far more code, I recommend **staying on Express 4.x** for now. Express 5 migration can be a separate future task.

> [!IMPORTANT]
> ### Mongoose Version Decision
> Backend A uses **Mongoose 8.x**, Backend B uses **Mongoose 9.x**. Since Backend A has 16 models vs 7, I recommend **staying on Mongoose 8.x** (or upgrading to latest 8.x). Mongoose 9 migration can happen separately.

> [!WARNING]
> ### Security Issue
> Backend B's `.env` file is **committed to the repository** with real Google OAuth credentials and Razorpay test keys. These should be rotated immediately regardless of the merge outcome.

> [!WARNING]
> ### Stale Backup
> `test/WBA_BACKEND/WBA_Back - Copy/` is a full backup of an older version of Backend B, including `node_modules`. This should be deleted as part of cleanup.

---

## Open Questions

> [!IMPORTANT]
> 1. **API path naming**: Backend A uses singular (`/api/template`, `/api/blog`), Backend B uses plural (`/api/templates`, `/api/blogs`). The `stackly_project_context.md` uses **plural** (`/api/templates`, `/api/projects`). Should we adopt **plural** (matching the spec)?

> [!IMPORTANT]
> 2. **"Workspace" vs "Project" terminology**: Backend A calls user sites "Workspaces" (`/api/workspace`), while the frontend and `stackly_project_context.md` call them "Projects" (`/api/projects`). Should we rename to **"Project"** for consistency with the frontend spec?

> [!IMPORTANT]
> 3. **Blog model scope**: Backend A's `BlogPost` is scoped to a workspace (`workspaceId`), meaning each project can have its own blog. Backend B's `Blog` is global (no project scope). The `stackly_project_context.md` spec shows `/api/projects/:id/posts` (project-scoped). Which approach do you want?

---

## Phase 3 Preview (Next Step — After Your Approval)

Phase 3 will be a **side-by-side file comparison** that produces:
- A merge decision per file (KEEP-A, KEEP-B, MERGE, NEW)
- Conflict resolution strategy for each overlapping module
- The exact list of Backend B features to port and where they land in Backend A's structure
- A migration checklist with ordering

**No code changes until you approve the Phase 3 comparison and the Phase 4 migration plan.**

---

## Verification Plan

### Phase 1 & 2 Verification
- ✅ Read every file in both `test/backend/` and `test/WBA_BACKEND/`
- ✅ Cataloged all models, controllers, routes, services, middleware, utils, and config
- ✅ Compared dependencies and versions
- ✅ Identified all unique features from both backends
- ✅ Cross-referenced against `stackly_project_context.md` API contracts
- ✅ No code changes were made
