# Stackly Backend — Setup Guide

## Prerequisites

- **Node.js** v18+ (recommended: v20 LTS)
- **npm** v9+
- **MongoDB Atlas** account (or local MongoDB v6+)
- **Git**

## Quick Start

```bash
# 1. Clone and enter backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your actual values (see "Environment Variables" below)

# 4. Start the server
npm run dev
# Backend runs at http://localhost:5000

# 5. Verify
curl http://localhost:5000/health
# → { "ok": true, "service": "stackly-backend" }
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/stackly` |
| `JWT_SECRET` | Secret for signing access tokens | Any random 64-char string |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | Any random 64-char string |
| `PORT` | Server port | `5000` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS and redirects | `http://localhost:3000` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |
| `MONGODB_DNS_SERVERS` | Custom DNS for MongoDB Atlas (useful on some networks) | `8.8.8.8,1.1.1.1` |

### Email (OTP)

| Variable | Description |
|----------|-------------|
| `EMAIL_DELIVERY_MODE` | `smtp` for real email, `console` for dev (OTP printed to terminal) |
| `SMTP_HOST` | SMTP server host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | SMTP username/email |
| `SMTP_PASS` | SMTP password or app password |
| `SMTP_FROM_NAME` | Sender display name |
| `SMTP_FROM_EMAIL` | Sender email address |

**Gmail Setup**: Use an [App Password](https://myaccount.google.com/apppasswords) (not your regular password). Set `SMTP_USER` to your Gmail and `SMTP_PASS` to the app password.

### SMS (OTP)

| Variable | Description |
|----------|-------------|
| `SMS_PROVIDER` | `mock` (dev mode), `twilio`, or `textlocal` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Twilio phone number |
| `TEXTLOCAL_API_KEY` | TextLocal API key |
| `TEXTLOCAL_SENDER` | TextLocal sender name |

In `mock` mode (development), OTPs are printed to the server console.

### Razorpay

| Variable | Description |
|----------|-------------|
| `RAZORPAY_KEY_ID` | Razorpay Key ID from Dashboard → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret |
| `RAZORPAY_MODE` | `test` or `live` |

Get test credentials from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys).

### Google OAuth

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Client secret from the same console |

**Setup**: Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Set authorized redirect URI to `http://localhost:5000/api/auth/google`.

## Running

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

## Seed Templates

Populate the database with 5 base templates:

```bash
npm run seed-templates
```

## Seed the Demo Store

Create or update the DB-backed demo storefront and its ten products:

```bash
npm run seed-store
```

Copy the printed workspace ID into `backend/.env` as `ECOMMERCE_WORKSPACE_ID`. Configure server-owned checkout totals with `ECOMMERCE_TAX_RATE` (for example `0.18`) and `ECOMMERCE_SHIPPING_COST`.

## Common Errors

### GitHub Pages redirects to `/backend-error`
GitHub Pages hosts only the static frontend. Deploy `render.yaml` as a Render Blueprint, then set the GitHub Actions secret `NEXT_PUBLIC_API_BASE_URL` to the Render service URL plus `/api` and redeploy Pages.

### `MONGODB_URI is not set`
→ Create/edit `backend/.env` and add your MongoDB connection string.

### `MongoDB connection error: querySrv ENOTFOUND`
→ DNS issue. Add `MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1` to `.env`.

### `CORS error in browser`
→ Ensure `FRONTEND_URL` and `CORS_ORIGINS` in `.env` match your frontend URL.

### `Email OTP delivery is not configured`
→ Either set `EMAIL_DELIVERY_MODE=console` (dev) or configure SMTP credentials.

### `Razorpay is not configured`
→ Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env`.

## Project Structure

```
backend/
├── server.js              # Entry point
├── .env                   # Environment variables (not in git)
├── .env.example           # Template for .env
├── package.json
├── scripts/
│   ├── seed-templates.js  # Seed base templates
│   └── send-test-email.js # Test email config
├── docs/
│   └── API_DOCUMENTATION.md
└── src/
    ├── app.js             # Express app setup
    ├── config/
    │   ├── db.js          # MongoDB connection
    │   ├── email.js       # Nodemailer config
    │   └── passport.js    # Google OAuth strategy
    ├── controllers/       # Route handlers
    ├── middleware/
    │   ├── auth.js        # JWT authentication
    │   ├── optionalAuth.js
    │   ├── requirePlan.js # Plan-based feature gating
    │   ├── errorHandler.js
    │   ├── requestLogger.js
    │   └── validate.js
    ├── models/            # Mongoose schemas
    │   ├── User.js
    │   ├── Otp.js
    │   ├── Workspace.js
    │   ├── WorkspaceState.js
    │   ├── Subscription.js
    │   ├── Template.js
    │   ├── AnalyticsEvent.js
    │   ├── BlogPost.js
    │   ├── Domain.js
    │   ├── Deployment.js
    │   ├── Product.js
    │   └── Order.js
    ├── routes/            # Express routers
    ├── services/          # Business logic
    ├── utils/
    │   ├── ApiError.js    # Custom error class
    │   ├── helpers.js     # OTP generation, user sanitization
    │   ├── jwt.js         # JWT sign/verify
    │   └── logger.js      # Structured logging
    └── validations/       # express-validator rules
```
