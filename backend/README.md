# Stackly — Backend API

Node.js + Express + MongoDB (Mongoose) REST API for the Stackly Website Builder.
Layered architecture: **routes → validators → controllers → services → models**, with
shared `middleware`, `helpers`, `utils`, `constants`, and `config`.

> Cloud deployment (AWS/Docker/CI/CD) is intentionally **out of scope** for this repo.
> The only cloud integration present is the existing local AWS S3 upload client used for images.

## Requirements

- Node.js `>=20 <25`
- A MongoDB connection string (MongoDB Atlas or local `mongod`)

## Setup

```bash
cd backend
cp .env.example .env      # then fill in the values
npm install
npm run dev               # starts on http://localhost:5000 (node --watch)
```

Health check: `GET http://localhost:5000/health` → `{ "ok": true, "service": "stackly-backend" }`

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm start` | `node server.js` | Start the server |
| `npm run dev` | `node --watch server.js` | Start with auto-reload |
| `npm run seed-templates` | seeds base templates | Requires DB + env |
| `npm run seed-store` | seeds a demo store + products | Requires DB + env |
| `npm run test:email` | sends a test SMTP email | Validates email config |

## Folder structure (`backend/src/`)

```
src/
├── app.js              Express app: CORS, parsers, passport, route mounts, error handlers
├── config/             Third-party clients & setup (email, passport, razorpay, s3)
├── constants/          Static config values (plans)
├── controllers/        Thin HTTP handlers that call services
├── database/           MongoDB connection (connection.js)
├── helpers/            Small shared helpers (generateOtp, sanitizeUser)
├── middleware/         auth, optionalAuth, requirePlan/Premium, validate, errorHandler, requestLogger, upload
├── models/             Mongoose schemas
├── routes/             Express routers (mounted under /api/*)
├── services/           Business logic
├── utils/              ApiError, jwt, logger
└── validators/         express-validator chains + generic field validators
server.js               Entry point: loads env, connects DB, listens
```

## API surface (mounted in `src/app.js`)

`/api/auth` · `/api/user` · `/api/workspace` · `/api/payment` · `/api/razorpay` ·
`/api/template` · `/api/analytics` · `/api/blog` · `/api/domain` · `/api/publish` ·
`/api/ecommerce` · `/api/cart` · `/api/wishlist` · `/api/checkout`

Full reference: [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) ·
Postman: [`docs/stackly-api.postman_collection.json`](docs/stackly-api.postman_collection.json) ·
Setup deep-dive: [`docs/BACKEND_SETUP_GUIDE.md`](docs/BACKEND_SETUP_GUIDE.md)

## Environment

See [`.env.example`](.env.example) for the complete, documented list (server, MongoDB, JWT,
Google OAuth, SMTP email, SMS, Razorpay, Stripe, AWS S3, email-whitelist, password-history).
