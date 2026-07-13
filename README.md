# Stackly — Website Builder Application

A no-code, drag-and-drop website builder (a simplified Wix / Squarespace). Users sign up,
pick a template, build pages visually on a canvas with 27+ block types, manage projects from a
dashboard, and export/publish sites. This repository is a **monorepo** with a Next.js frontend
and a Node.js/Express/MongoDB backend.

```
Website-Builder-Application/
├── frontend/      Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4
├── backend/       Node.js + Express + MongoDB (Mongoose), layered architecture
├── docs/          Project docs — codebase-analysis dashboard + planning/ archive
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
<summary><b>backend/</b> — Express API (Backend A, primary; Backend B merged in)</summary>

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

## Environment variables

Copy each `.env.example` and fill in real values.

### Backend — `backend/.env`  (see `backend/.env.example` for the full list)

| Group | Keys |
|-------|------|
| Server | `PORT`, `NODE_ENV`, `FRONTEND_URL`, `API_BASE_URL`, `CORS_ORIGINS` |
| MongoDB | `MONGODB_URI`, `MONGODB_DNS_SERVERS` |
| JWT | `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Email / SMTP | `EMAIL_DELIVERY_MODE`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL` |
| SMS | `SMS_PROVIDER`, `TWILIO_*`, `TEXTLOCAL_*` |
| Razorpay | `PAYMENT_PRIMARY_PROVIDER`, `RAZORPAY_MODE`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| Stripe (optional) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` |
| AWS S3 (uploads) | `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| E-commerce | `ECOMMERCE_TAX_RATE`, `ECOMMERCE_SHIPPING_COST`, `ECOMMERCE_WORKSPACE_ID` |
| Auth policy | `EMAIL_DOMAIN_WHITELIST_ENABLED`, `EMAIL_DOMAIN_WHITELIST`, `PASSWORD_HISTORY_DEPTH` |

### Frontend — `frontend/.env.local`  (see `frontend/.env.example`)

| Key | Purpose |
|-----|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base (default `http://localhost:5000/api`) |
| `NEXT_PUBLIC_BASE_PATH` | Optional sub-path when hosting under a prefix |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client id (match backend) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key |
| `NEXT_PUBLIC_RAZORPAY_API_BASE` | Razorpay dev API helper base (`http://localhost:3001`) |
| `NEXT_PUBLIC_RAZORPAY_DEMO` | `true` to run Razorpay in demo mode |

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
5. **Docs**: the codebase-analysis dashboard lives in [`docs/index.html`](docs/index.html);
   historical planning docs are in [`docs/planning/`](docs/planning/).

### Known integration follow-ups
- Some frontend API clients call `/api/projects` and `/api/templates`, while the backend
  currently mounts `/api/workspace` and `/api/template`. Aligning these route names (or adding
  aliases) is a functional task tracked separately — it is **not** part of this structural setup.
