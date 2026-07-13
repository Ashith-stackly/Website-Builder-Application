# Stackly API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All authenticated endpoints require a `Bearer` token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "+919876543210",
  "password": "SecurePass1!",
  "confirmPassword": "SecurePass1!"
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Please verify your email.",
  "otp": "1234"  // only in development
}
```

### POST /auth/login
Login with email/mobile and password.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass1!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "message": "Login successful",
  "userType": "user",
  "user": { "_id": "...", "name": "John Doe", "email": "john@example.com", "plan": "free" }
}
```

### POST /auth/refresh
Refresh access token.

**Body:** `{ "refreshToken": "..." }`

### POST /auth/forgot-password
Send OTP for password reset.

**Body:** `{ "input": "john@example.com" }`

**Response:** `{ "message": "OTP sent to your email", "moveToVerify": true, "otp": "1234" }`

### POST /auth/send-email-otp
Send OTP to registered email.

**Body:** `{ "email": "john@example.com" }`

### POST /auth/send-mobile-otp
Send OTP to registered mobile.

**Body:** `{ "mobile": "+919876543210" }`

### POST /auth/verify-email
Verify email OTP.

**Body:** `{ "email": "john@example.com", "otp": "1234" }`
**Resend:** `{ "email": "john@example.com", "action": "resend" }`

**Response:** `{ "token": "...", "message": "Email verified" }`

### POST /auth/verify-mobile
Verify mobile OTP.

**Body:** `{ "mobile": "+919876543210", "otp": "1234" }`

### POST /auth/reset-password
Reset password with reset token.

**Headers:** `Authorization: Bearer <reset_token>`
**Body:** `{ "newPassword": "NewPass1!", "confirmPassword": "NewPass1!" }`

### GET /auth/google
Initiate Google OAuth flow.

---

## User Endpoints

### GET /user/profile 🔒
Get current user profile.

**Response:**
```json
{
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "+919876543210",
    "avatar": "",
    "plan": "free",
    "subscriptionStatus": "none",
    "isEmailVerified": true,
    "isMobileVerified": false
  }
}
```

### PUT /user/profile 🔒
Update profile.

**Body:** `{ "name": "Jane Doe", "avatar": "https://...", "mobile": "+919876543210" }`

---

## Workspace Endpoints

### POST /workspace/create 🔒

**Body:**
```json
{
  "projectName": "My Website",
  "category": "business",
  "style": "Modern",
  "sections": ["navigation", "hero", "features", "contact"]
}
```

### GET /workspace/list 🔒
Query params: `page`, `limit`

**Response:**
```json
{
  "projects": [...],
  "pagination": { "page": 1, "limit": 20, "total": 5, "pages": 1 }
}
```

### GET /workspace/:id 🔒
### PUT /workspace/:id 🔒
### DELETE /workspace/:id 🔒
### POST /workspace/:id/duplicate 🔒
### PUT /workspace/:id/settings 🔒
### GET /workspace/:id/state 🔒

**Response:** `{ "state": { "workspaceId": "...", "pageData": {}, "builderData": {} } }`

### PUT /workspace/:id/state 🔒

**Body:** `{ "pageData": {}, "builderData": { "components": [...] } }`

---

## Template Endpoints

### GET /template/list
List templates. Public, no auth required.

Query params: `category`, `search`, `page`, `limit`

### GET /template/:idOrSlug
Get template details. Public.

### POST /template/:id/use 🔒
Clone template into a new workspace. Returns the created workspace.

---

## Payment Endpoints

### POST /razorpay/create-order 🔒

**Body:** `{ "amountPaise": 29900, "planName": "Premium", "billingPeriod": "Monthly" }`

**Response:** `{ "orderId": "order_...", "amount": 29900, "currency": "INR", "keyId": "rzp_test_..." }`

### POST /razorpay/verify 🔒

**Body:**
```json
{
  "razorpay_payment_id": "pay_...",
  "razorpay_order_id": "order_...",
  "razorpay_signature": "...",
  "amount": 29900,
  "planName": "Premium",
  "billingPeriod": "Monthly"
}
```

### GET /payment/subscription 🔒
Get current subscription status.

### POST /payment/cancel 🔒
Cancel subscription.

### POST /payment/create-checkout 🔒
Create Stripe checkout session (requires Stripe config).

---

## Analytics Endpoints

### POST /analytics/event
Ingest analytics event. Public (called from published sites).

**Body:**
```json
{
  "workspaceId": "...",
  "eventType": "page_view",
  "path": "/",
  "referrer": "https://google.com",
  "sessionId": "abc123"
}
```

### GET /analytics/:workspaceId 🔒
Get project analytics. Query params: `days` (default 30).

---

## Blog Endpoints

### POST /blog/post 🔒

**Body:**
```json
{
  "workspaceId": "...",
  "title": "My First Post",
  "content": "...",
  "status": "draft",
  "category": "tech",
  "tags": ["web", "design"]
}
```

### GET /blog/posts/:workspaceId 🔒
### GET /blog/post/:id 🔒
### PUT /blog/post/:id 🔒
### DELETE /blog/post/:id 🔒
### GET /blog/sitemap/:workspaceId
Generate sitemap XML. Public.

---

## Domain Endpoints

### POST /domain/:workspaceId/subdomain 🔒
Generate unique subdomain.

### PUT /domain/:workspaceId/custom 🔒

**Body:** `{ "customDomain": "example.com" }`

### POST /domain/:workspaceId/verify-dns 🔒
### GET /domain/:workspaceId 🔒

---

## Publish Endpoints

### POST /publish/:workspaceId 🔒
Publish site (creates deployment version).

### GET /publish/:workspaceId/deployments 🔒
List deployment history.

### GET /publish/:workspaceId/active 🔒
Get latest active deployment.

### POST /publish/:workspaceId/rollback/:deploymentId 🔒
Rollback to a previous version.

---

## E-Commerce Endpoints

### POST /ecommerce/product 🔒
### GET /ecommerce/products/:workspaceId 🔒
### GET /ecommerce/product/:id 🔒
### PUT /ecommerce/product/:id 🔒
### DELETE /ecommerce/product/:id 🔒
### POST /ecommerce/order (Public — checkout from published store)
### GET /ecommerce/orders/:workspaceId 🔒
### GET /ecommerce/order/:id 🔒
### PUT /ecommerce/order/:id 🔒

---

## Storefront Cart, Wishlist, and Checkout

### GET /ecommerce/store/:workspaceId/products
Public active-product catalog. Use `default` as the workspace ID to load `ECOMMERCE_WORKSPACE_ID`.

### GET /cart/:workspaceId (auth required)
### POST /cart/:workspaceId/items (auth required)
Body: `{ "productId": "...", "quantity": 1 }`
### PUT /cart/:workspaceId/items/:itemId (auth required)
### DELETE /cart/:workspaceId/items/:itemId (auth required)
### DELETE /cart/:workspaceId (auth required)

### GET /wishlist/:workspaceId (auth required)
### POST /wishlist/:workspaceId/:productId (auth required)
### DELETE /wishlist/:workspaceId/:productId (auth required)

### POST /checkout/create-order (auth required)
Creates a pending order from the user's cart. Prices, tax, shipping, currency, and inventory are validated server-side.

### POST /checkout/verify-payment
Verifies the Razorpay signature, confirms the order, decrements inventory once, and clears the cart.

### GET /checkout/orders (auth required)
### GET /checkout/orders/:id (auth required)

---

## Health Check

### GET /health

**Response:** `{ "ok": true, "service": "stackly-backend" }`

---

🔒 = Requires `Authorization: Bearer <token>` header
