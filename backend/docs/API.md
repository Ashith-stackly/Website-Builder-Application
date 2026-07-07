# Stackly Backend API

Base URL: `http://localhost:5000/api`

Authentication uses `Authorization: Bearer <access_token>`. Refresh tokens are exchanged with `/auth/refresh`.

## Health

- `GET /health`
  - Returns `{ ok, service }`.

## Auth

- `POST /api/auth/register`
  - Body: `{ name, email, mobile, password, confirmPassword }`
  - Creates a local user and sends email OTP.

- `POST /api/auth/login`
  - Body: `{ email?, mobile?, password }`
  - Returns `{ token, refreshToken, userType, user }`.

- `POST /api/auth/refresh`
  - Body: `{ refreshToken }`
  - Returns fresh `{ token, refreshToken, user }`.

- `POST /api/auth/forgot-password`
  - Body: `{ input }`
  - Sends email or mobile OTP.

- `POST /api/auth/verify-email`
  - Body: `{ email, otp }` or `{ email, action: "resend" }`
  - Verifies email OTP and returns reset token.

- `POST /api/auth/verify-mobile`
  - Body: `{ mobile, otp }` or `{ mobile, action: "resend" }`
  - Verifies mobile OTP and returns reset token.

- `POST /api/auth/reset-password`
  - Header: `Authorization: Bearer <reset_token>`
  - Body: `{ newPassword, confirmPassword }`

- `GET /api/auth/google`
  - Google OAuth code callback. Redirect URI must match this URL.

## User

- `GET /api/user/profile`
  - Auth required. Returns `{ user }`.

- `PUT /api/user/profile`
  - Auth required.
  - Body: `{ name?, avatar? }`

## Workspace

- `POST /api/workspace/create`
  - Auth required.
  - Body: `{ projectName, category?, style?, sections?, components?, designTokens? }`

- `GET /api/workspace/list?page=1&limit=20`
  - Auth required. Returns `{ projects, pagination }`.

- `GET /api/workspace/:id`
  - Auth required.

- `PUT /api/workspace/:id`
  - Auth required.
  - Body supports project fields, components, and design tokens.

- `DELETE /api/workspace/:id`
  - Auth required. Soft deletes workspace.

- `POST /api/workspace/:id/duplicate`
  - Auth required.

- `PUT /api/workspace/:id/settings`
  - Auth required.
  - Body: `{ domain?, seo?, visibility? }`

- `GET /api/workspace/:id/state`
  - Auth required. Returns builder autosave state.

- `PUT /api/workspace/:id/state`
  - Auth required.
  - Body: `{ pageData?, builderData? }`

## Payment

Razorpay test is the primary provider.

- `POST /api/razorpay/create-order`
  - Auth optional, recommended.
  - Body: `{ amountPaise, planName, billingPeriod }`
  - Returns `{ orderId, amount, currency, keyId }`.

- `POST /api/razorpay/verify`
  - Auth optional, required for subscription sync.
  - Body: `{ razorpay_payment_id, razorpay_order_id, razorpay_signature, amount?, currency?, planName?, billingPeriod? }`
  - If authenticated and verified, updates `User.plan`, `User.subscriptionStatus`, and `Subscription`.

- `POST /api/payment/create-checkout`
  - Auth required. Secondary Stripe checkout.

- `POST /api/payment/webhook`
  - Stripe webhook endpoint.

- `POST /api/payment/cancel`
  - Auth required. Cancels local subscription state and Stripe subscription if `subscriptionId` is supplied and Stripe is configured.
