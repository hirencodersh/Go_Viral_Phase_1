# Social Media Platform

An Instagram-inspired social portal with a React/TypeScript frontend and an
Express/TypeScript REST API. Phase 1 provides registration, login, logout,
session checks, and a protected dashboard shell.

## Architecture

```text
frontend/src/
  components/ui/        shared form controls
  features/auth/        auth pages, schemas, API, and hooks
    AuthContext.tsx     current-user state and auth actions
  features/dashboard/   protected starter dashboard
  layouts/              responsive authentication layout
  pages/                not-found route
  routes/               guest and authenticated route guards
  services/             Axios API client
  assets/               static frontend assets
backend/src/
  config/               environment validation and MongoDB startup
  controllers/          HTTP request/response handlers
  middleware/           cookie authentication, rate limits, and error handling
  models/               Mongoose schemas and unique indexes
  routes/               authentication and API routes
  services/              authentication/business logic
  types/                 API types and Express request augmentation
  utils/                 shared error and async-handler utilities
  validators/            Zod request validation
docs/postman/             importable auth API collection
```

The backend hashes passwords with bcrypt and stores JWTs in HttpOnly cookies.
Tokens are not returned in JSON or persisted in browser storage. Registration
normalizes email and username and relies on MongoDB unique indexes to prevent
duplicates.

## Requirements

- Node.js 20.19 or newer
- npm
- MongoDB Community Server or a reachable MongoDB deployment

## Local development

In a PowerShell terminal:

```powershell
cd backend
npm install
if (!(Test-Path .env.development)) { Copy-Item .env.example .env.development }
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Set the generated random value as `JWT_SECRET` in
`backend/.env.development`, then start the backend:

```powershell
npm run dev
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api`
requests to `http://127.0.0.1:5000`. Configure MongoDB and backend secrets in
`backend/.env.development`; frontend overrides belong in `frontend/.env.local`.
Environment files are ignored by Git.

## Authentication endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

While the backend is running, open `http://127.0.0.1:5000/api-docs` for the
interactive Swagger UI. The OpenAPI document is available at
`http://127.0.0.1:5000/api-docs.json`.

Import [`docs/postman/Social-Media-Auth.postman_collection.json`](docs/postman/Social-Media-Auth.postman_collection.json)
into Postman to exercise the API. Postman retains the HttpOnly cookie between
requests.

## Checks

```powershell
cd backend
npm run typecheck
npm test -- --runInBand
npm run build

cd ../frontend
npm run lint
npm run build
```

For production, provide `NODE_ENV=production`, `MONGO_URI`, a generated
`JWT_SECRET` of at least 32 characters, and the exact `CLIENT_URL`. Keep the
frontend/API on the same site for the default `SameSite=Lax` cookie policy.
Cross-site deployments need an explicit CSRF-token strategy.
