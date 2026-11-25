# Architecture Overview

## Phase 1 scope

The first release provides account registration, login, logout, authenticated
session lookup, and a protected dashboard shell. Posts, messaging, and other
social features are intentionally out of scope.

## Applications

- **Frontend:** React 19, TypeScript, Vite, React Router, Axios, React Hook
  Form, Zod, and responsive CSS with Bootstrap available for shared primitives.
- **Backend:** Node.js 20.19+, Express, TypeScript, Mongoose 8, Zod,
  bcryptjs, and jsonwebtoken 9.
- **Database:** MongoDB. User email and username are normalized and enforced
  by unique database indexes.

## Frontend layers

```text
frontend/src/
  App.tsx
  components/ui/        reusable form controls
  features/auth/        auth pages, schemas, API, context, and hook
  features/dashboard/   authenticated dashboard placeholder
  layouts/              responsive auth layout
  pages/                not-found page
  routes/               guest and protected route guards
  services/             Axios client configured for cookie credentials
  assets/               static assets
  index.css, App.css    theme tokens and responsive styling
```

The auth context fetches `/api/auth/me` on startup, stores only the public user
profile in React state, and exposes register/login/logout actions. A
`ProtectedRoute` redirects unauthenticated visitors to login. Tokens are never
stored in local storage or exposed to JavaScript.

## Backend layers

```text
backend/src/
  app.ts
  server.ts
  config/       environment schema and MongoDB startup
  controllers/  HTTP input/output handling
  middleware/   cookie auth, rate limits, and centralized errors
  models/       Mongoose user schema and unique indexes
  routes/       auth endpoints and API route mounting
  services/     account creation, password verification, and JWT signing
  types/        public API and Express request types
  utils/        AppError and async-handler
  validators/   Zod request-body schemas
```

The server validates environment variables and waits for MongoDB and the user
indexes before accepting requests. Async route errors flow to one error
middleware and API responses follow a consistent envelope.

## Authentication flow

1. The frontend validates signup/login forms and sends JSON through the Vite
   `/api` proxy (or the configured API base URL).
2. The backend validates and normalizes request data. Registration hashes
   passwords with bcrypt before persistence; database unique indexes protect
   against duplicate email/username races.
3. Login/register issue a signed JWT in an `HttpOnly`, `SameSite=Lax` cookie.
   The production cookie is `Secure`. “Remember me” extends token/cookie life
   to 30 days; otherwise the cookie is a browser-session cookie and token life
   is one day.
4. `GET /api/auth/me` verifies the cookie and returns only public user fields.
   Logout clears the cookie. Expired and invalid tokens receive HTTP 401.

## Deployment notes

Configure `MONGO_URI`, a random `JWT_SECRET` of at least 32 characters,
`CLIENT_URL`, `PORT`, and `NODE_ENV` through the deployment platform.
`CLIENT_URL` must be the exact allowed frontend origin. Keep the frontend and
API on the same site for the default `SameSite=Lax` cookie policy. Cross-site
deployments require an explicit CSRF-token strategy. Use a shared rate-limit
store if deploying multiple API replicas.
