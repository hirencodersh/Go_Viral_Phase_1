# Social Media Platform Backend

TypeScript REST API for user authentication and the initial Socially dashboard.

## Requirements

- Node.js 20.19 or newer
- MongoDB running locally or a reachable MongoDB URI

## Local setup

```powershell
npm install
if (!(Test-Path .env.development)) { Copy-Item .env.example .env.development }
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Set the generated value as `JWT_SECRET` in `.env.development`, then start the
API:

```powershell
npm run dev
```

The local API listens on port 5000. The frontend Vite server proxies `/api` to
it. Never commit `.env.development` or production credentials.

## Authentication API

All responses use `{ "success": boolean, "message": string, "data": object }`
on success. Errors use `success: false` and a safe message; validation failures
also return field-level `errors`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Validate and create an account |
| `POST` | `/api/auth/login` | Verify credentials and start a session |
| `POST` | `/api/auth/logout` | Clear the session cookie |
| `GET` | `/api/auth/me` | Return the authenticated user |

The JWT is issued only in an `HttpOnly`, `SameSite=Lax` cookie; it is not
returned in JSON or stored by the frontend. Production cookies use `Secure`.
The configured CORS origin is `CLIENT_URL`. For cross-site deployments, use a
same-site frontend/API hostname or add a CSRF-token strategy before changing
the cookie policy.

## Swagger UI

With the backend running, open [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
for interactive Swagger UI. The machine-readable OpenAPI 3.0 document is
available at [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json).
It documents the root welcome route, health check, and all authentication
endpoints. Register or log in in Swagger UI to set the HttpOnly session cookie
before trying the protected `GET /api/auth/me` endpoint.

## Structure

```text
src/
  app.ts
  server.ts
  docs/           OpenAPI specification
  config/          environment validation and MongoDB startup
  controllers/     HTTP request and response handling
  middleware/      authentication, rate limiting, and error responses
  models/          Mongoose schemas and unique indexes
  routes/          auth endpoints and API route registration
  services/        authentication and account business logic
  types/           API types and Express request augmentation
  utils/           shared errors and async-handler
  validators/      request schemas and validation middleware
tests/             API contract tests
```

`User.init()` runs before the HTTP server starts, ensuring the unique email and
username indexes exist before registration requests are accepted.

## Production

Set `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET` (at least 32 random
characters), and `CLIENT_URL` in the deployment platform. Then run:

```powershell
npm run build
npm start
```

## Tests and Postman

Run API contract tests with:

```powershell
npm test -- --runInBand
```

Import [`../docs/postman/Social-Media-Auth.postman_collection.json`](../docs/postman/Social-Media-Auth.postman_collection.json)
into Postman to try register, login, `/me`, and logout. Postman retains the
authentication cookie between requests.
