# Stackly — Website Builder Application

A no-code, drag-and-drop website builder (a simplified Wix / Squarespace). Users sign up,
pick a template, build pages visually on a canvas with 27+ block types, manage projects from a
dashboard, and export/publish sites. This repository is a **monorepo** with a Next.js frontend
and a Node.js/Express/MongoDB backend.

```
Website-Builder-Application/
├── frontend/      Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4
├── backend/       Node.js + Express + MongoDB (Mongoose), unified layered architecture
├── docs/          Project docs — codebase-analysis dashboard + manager briefs
├── README.md      You are here
└── .gitignore
```

> **Scope note.** Cloud deployment, CI/CD, Docker, Kubernetes, Terraform, AWS infrastructure
> and hosting are **out of scope** for this repo. The only cloud touch-point is the existing
> local AWS S3 upload client (image uploads) inside the backend.

---

## Folder structure

<details open>
<summary><b>frontend/</b> — Next.js app (unchanged from its original structure)</summary>

```
frontend/
├── app/                 App Router pages (auth, dashboard, builder, blog, templates, …)
├── components/          UI components (builder/, dashboard/, analytics/, blocks/, draggable/, …)
├── lib/                 API clients (api, projectApi, templateApi, blogApi) + utilities
├── store/               Zustand stores (builder, asset, project, design)
├── hooks/               React hooks
├── types/               Shared TypeScript types
├── public/              Static assets
├── scripts/             Dev helpers (Next dev + Razorpay dev API)
├── next.config.mjs      output: "export" (static export)
├── package.json
└── .env.example
```
</details>

<details open>
<summary><b>backend/</b> — Consolidated Express API with 16 database models and 15 route controllers</summary>

```
backend/
├── src/
│   ├── app.js           Express app (CORS, parsers, passport, routes, error handlers)
│   ├── config/          Third-party clients: email, passport, razorpay, s3
│   ├── constants/       Static values (plans)
│   ├── controllers/     Thin HTTP handlers
│   ├── database/        MongoDB connection
│   ├── helpers/         generateOtp, sanitizeUser
│   ├── middleware/      auth, requirePlan/Premium, validate, errorHandler, requestLogger, upload
│   ├── models/          Mongoose schemas
│   ├── routes/          Express routers (mounted under /api/*)
│   ├── services/        Business logic
│   ├── utils/           ApiError, jwt, logger
│   └── validators/      express-validator chains + field validators
├── scripts/             Seed & test scripts
├── docs/                API reference, Postman collection, setup guide
├── server.js            Entry point
├── package.json
└── .env.example
```
</details>

Notes on the backend layout:
- `database/` holds the Mongo connection; the AWS **S3** client stays in `config/s3.js`
  (single-file infra config) — no separate `storage/` folder is created.
- Uploads use **in-memory** multer storage (streamed straight to S3), so there is **no
  on-disk `uploads/` folder**.

---

## Prerequisites

- **Node.js** `>=20 <25`
- **MongoDB** — a connection string (MongoDB Atlas or a local `mongod`)
- npm (bundled with Node)

---

## Installation

Install each package independently (no workspace tooling is used):

```bash
# from the repo root
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## Environment Setup

To run the Website Builder Application locally or prepare it for production, copy the template files and fill in the required configuration variables.

### Copy Configuration Files

#### Linux/macOS
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

#### Windows (Command Prompt / PowerShell)
```cmd
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

---

### Backend Environment Variables (`backend/.env`)

| Variable | Required | Default | Purpose / Description |
|---|---|---|---|
| **Server** | | | |
| `PORT` | No | `5000` | Port the Express API server listens on. |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `production`, `test`). |
| `FRONTEND_URL` | No | `http://localhost:3000` | URL of the frontend app (used for CORS and auth redirects). |
| `API_BASE_URL` | No | `http://localhost:5000/api` | Base URL of this backend API. |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated list of allowed CORS origins. |
| `APP_DOMAIN` | No | `localhost` | Domain name under which subdomains are resolved locally. |
| `PUBLIC_APP_DOMAIN` | No | `localhost` | Production domain name for subdomain resolution. |
| **MongoDB** | | | |
| `MONGODB_URI` | **Yes** | — | MongoDB connection URL (local instance or MongoDB Atlas). |
| `MONGODB_DNS_SERVERS` | No | `8.8.8.8,1.1.1.1` | Override DNS servers to resolve MongoDB Atlas cluster SRV records. |
| **JWT** | | | |
| `JWT_SECRET` | **Yes** | — | Private key for signing access JSON Web Tokens. |
| `JWT_EXPIRES_IN` | No | `7d` | Lifetime duration of JWT access tokens. |
| `JWT_REFRESH_SECRET`| **Yes** | — | Private key for signing session refresh tokens. |
| `JWT_REFRESH_EXPIRES_IN`| No| `30d` | Lifetime duration of JWT refresh tokens. |
| **Google OAuth** | | | |
| `GOOGLE_CLIENT_ID` | No | — | Google Cloud OAuth Client ID (for Google login integration). |
| `GOOGLE_CLIENT_SECRET` | No | — | Google Cloud OAuth Client Secret. |
| `GOOGLE_CALLBACK_URL` | No | `http://localhost:5000/api/auth/google/callback` | Redirect callback URL configured in Google Developer Console. |
| **GitHub OAuth** | | | |
| `GITHUB_CLIENT_ID` | No | — | GitHub OAuth Client ID (optional - future implementation). |
| `GITHUB_CLIENT_SECRET` | No | — | GitHub OAuth Client Secret (optional - future implementation). |
| **Email / SMTP** | | | |
| `EMAIL_DELIVERY_MODE` | No | `console` | OTP delivery mode: `smtp` for real emails, `console` to print to terminal. |
| `SMTP_HOST` | No | — | SMTP mail server hostname. |
| `SMTP_PORT` | No | `587` | SMTP mail server port. |
| `SMTP_SECURE` | No | `false` | Enable SMTP SSL/TLS connection (`true` for port 465). |
| `SMTP_USER` | No | — | SMTP service username/email. |
| `SMTP_PASS` | No | — | SMTP service password. |
| `SMTP_FROM_NAME` | No | `Stackly` | Sender name shown in outgoing emails. |
| `SMTP_FROM_EMAIL` | No | — | Sender email address. Defaults to `SMTP_USER`. |
| `TEST_EMAIL_TO` | No | — | Custom email address for running backend email test scripts. |
| **SMS** | | | |
| `SMS_PROVIDER` | No | `mock` | SMS gateway provider (`mock`, `twilio`, or `textlocal`). |
| `TWILIO_ACCOUNT_SID` | No | — | Twilio account identifier. |
| `TWILIO_AUTH_TOKEN` | No | — | Twilio authorization token. |
| `TWILIO_FROM_NUMBER` | No | — | Twilio phone number. |
| `TEXTLOCAL_API_KEY` | No | — | Textlocal API key. |
| `TEXTLOCAL_SENDER` | No | — | Textlocal sender name. |
| **Razorpay Payment** | | | |
| `PAYMENT_PRIMARY_PROVIDER` | No | `razorpay` | Primary payment gateway driver. |
| `RAZORPAY_MODE` | No | `test` | Razorpay transaction mode (`test` or `live`). |
| `RAZORPAY_KEY_ID` | **Yes** | `rzp_test_Sx4RHrkl9mpz0s` | Razorpay public key ID. |
| `RAZORPAY_KEY_SECRET` | **Yes** | `JGQNY14J8H0Rs6RvoPe7LyOs` | Razorpay private secret key. |
| **Stripe Payment** | | | |
| `STRIPE_SECRET_KEY` | No | — | Stripe secret API key (optional gateway). |
| `STRIPE_WEBHOOK_SECRET` | No | — | Stripe webhook verification secret. |
| `STRIPE_PRICE_ID` | No | — | Stripe default plan price ID. |
| **AWS S3 Storage** | | | |
| `AWS_S3_BUCKET` | No | — | S3 bucket name for user asset uploads and static site hosting. |
| `AWS_REGION` | No | `us-east-1` | AWS S3 deployment region. |
| `AWS_ACCESS_KEY_ID` | No | — | AWS IAM user access key. |
| `AWS_SECRET_ACCESS_KEY` | No | — | AWS IAM user secret key. |
| **Auth Policy & Whitelists** | | | |
| `EMAIL_DOMAIN_WHITELIST_ENABLED` | No | `false` | Restrict user signup to approved email domains if `true`. |
| `EMAIL_DOMAIN_WHITELIST` | No | `gmail.com,yahoo.com,outlook.com,hotmail.com` | Comma-separated list of allowed domains. |
| `PASSWORD_HISTORY_DEPTH` | No | `3` | Number of previous passwords stored to prevent immediate reuse. |
| **AI Content Assistant** | | | |
| `AI_PROVIDER` | No | `openai` | Text model provider (`openai`, `mock`, or `disabled`). |
| `OPENAI_API_KEY` | No | — | OpenAI API key. |
| `OPENAI_TEXT_MODEL` | No | `gpt-4.1-mini` | Model for text prompt completion. |
| `IMAGE_PROVIDER` | No | `openai` | Image model provider (`openai`, `mock`, or `disabled`). |
| `OPENAI_IMAGE_MODEL` | No | `gpt-image-1` | Model for image generation. |
| `OPENAI_API_BASE_URL` | No | `https://api.openai.com/v1` | Custom OpenAI base URL for enterprise/self-hosted endpoints. |
| `AI_REQUEST_TIMEOUT_MS` | No | `30000` | Timeout in milliseconds for AI requests. |
| `AI_RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limiter tracking window. |
| `AI_TEXT_RATE_LIMIT_MAX` | No | `20` | Max text helper requests per user in the window. |
| `AI_IMAGE_RATE_LIMIT_MAX` | No | `6` | Max image helper requests per user in the window. |
| `AI_LAYOUT_RATE_LIMIT_MAX` | No | `30` | Max layout helper requests per user in the window. |

---

### Frontend Environment Variables (`frontend/.env.local`)

| Variable | Required | Default | Purpose / Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | No | `http://localhost:5000/api` | Browser-accessible base URL for the backend API. |
| `NEXT_PUBLIC_BASE_PATH` | No | — | Subdirectory prefix if deployed under a path (e.g. GitHub Pages `/Website-Builder-Application`). |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | **Yes** | `rzp_test_Sx4RHrkl9mpz0s` | Razorpay public Key ID (must match backend). |
| `NEXT_PUBLIC_RAZORPAY_API_BASE` | No | `http://localhost:3001` | Local fallback proxy URL for mock static transactions helper. |
| `NEXT_PUBLIC_RAZORPAY_DEMO` | No | `false` | Set to `true` to run checkout in client-side mock demo mode. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | — | Google client ID for front-end authentication login button. |
| `NEXT_PUBLIC_ECOMMERCE_WORKSPACE_ID` | No | — | Override key for default e-commerce workspace storefront loaded by app. |

---


## Running locally

Open two terminals.

```bash
# 1) Backend  → http://localhost:5000
cd backend
npm run dev

# 2) Frontend → http://localhost:3000
cd frontend
npm run dev
```

The frontend talks to the backend via `NEXT_PUBLIC_API_BASE_URL`. Make sure MongoDB is
reachable before starting the backend.

---

## Build commands

| Target | Command | Output |
|--------|---------|--------|
| Frontend build | `cd frontend && npm run build` | Static export to `frontend/out/` |
| Frontend start | `cd frontend && npm run start` | Serves the production build |
| Frontend lint | `cd frontend && npm run lint` | ESLint |
| Backend start | `cd backend && npm start` | Runs the API server |

## Deployment

GitHub Pages hosts the static frontend only. The workflow in `.github/workflows/deploy.yml`
builds from `frontend/` and uploads `frontend/out/`.

Required GitHub repository secret:

| Secret | Value |
|--------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | Your deployed backend URL plus `/api`, for example `https://stackly-backend.onrender.com/api` |

The backend must be deployed separately. A Render blueprint is provided in `render.yaml`;
when using it, set the prompted backend environment variables such as `MONGODB_URI`,
`JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `CORS_ORIGINS`, and `API_BASE_URL`.

---

## Development workflow

1. **Branch** off the default branch for each change.
2. **Backend**: add a feature by wiring `route → validator → controller → service → model`.
   Keep controllers thin; put logic in `services/`. Throw `ApiError` for expected failures —
   `middleware/errorHandler` formats the response.
3. **Frontend**: build UI in `components/`, state in `store/`, and call the backend through the
   typed clients in `lib/` (`api.ts`, `projectApi.ts`, `templateApi.ts`, `blogApi.ts`).
4. **Standards**: consistent folder/file naming, `require`/`module.exports` on the backend,
   ES modules on the frontend, env-driven config, and a uniform JSON response/error shape.
5. **Docs**: the codebase-analysis dashboard lives in [`docs/index.html`](docs/index.html).
