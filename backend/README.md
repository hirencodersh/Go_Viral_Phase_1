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

Successful responses use `{ "success": true, "message": string, "data": object | null }`.
Errors use `success: false` and a safe message; validation failures also return
field-level `errors`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Validate and create an account |
| `POST` | `/api/auth/login` | Verify credentials and start a session |
| `POST` | `/api/auth/forgot-password` | Email a single-use password reset link |
| `POST` | `/api/auth/reset-password` | Set a new password with a valid reset token |
| `POST` | `/api/auth/logout` | Clear the session cookie |
| `GET` | `/api/auth/me` | Return the authenticated user |
| `GET` | `/api/posts` | Return the latest 50 posts |
| `POST` | `/api/posts` | Publish an image or video with a title and caption |
| `GET` | `/api/posts/explore` | Explore all users' posts with cursor pagination |

Post uploads accept JPG, PNG, WebP, MP4, WebM, and MOV files up to 50 MB.
Post metadata and author references are stored in MongoDB; uploaded media is
stored in the configured `UPLOAD_DIR` (the local `uploads/` directory by
default).

MongoDB keeps account credentials in `users`, public profile details in
`profiles` (one profile per user), and media post metadata in `posts`.
On startup, existing profile fields are copied from `users` into `profiles`
before the legacy fields are removed.

Password reset supports SMTP providers. Configure `SMTP_HOST`, `SMTP_PORT`,
`SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and optionally `SMTP_FROM` in
`.env.development` (or your backend deployment environment). For Gmail, use a Google
App Password, not your normal account password. Port `587` uses STARTTLS and
port `465` uses secure TLS. `SMTP_PASSWORD` is still accepted as a legacy alias
for `SMTP_PASS`; when `SMTP_FROM` is blank, `SMTP_USER` is used as the sender.
SMTP settings are validated when email is used so missing mail configuration
does not prevent unrelated API features from starting.

Resend can be used as the SMTP provider without another package. Set
`RESEND_API_KEY` and `SMTP_FROM` to an address on a domain verified in Resend.
When the key is present, the backend automatically uses `smtp.resend.com`, the
SMTP username `resend`, and the API key as the SMTP password; any old
`SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS` values are ignored. Port `587` with
`SMTP_SECURE=false` works; if `SMTP_PORT` and `SMTP_SECURE` are omitted, Resend
defaults to port `465` with secure TLS. Resend requires a verified sending
domain, so a Gmail address is not a valid `SMTP_FROM` unless that domain is
verified with Resend.

Common settings use port `587` with `SMTP_SECURE=false` (STARTTLS). Gmail uses
`smtp.gmail.com` and requires a Google App Password. Outlook.com commonly uses
`smtp-mail.outlook.com`; Microsoft 365 commonly uses `smtp.office365.com` and
may require SMTP AUTH to be enabled for the mailbox. Use the credentials or
app-password method allowed by the provider. Keep credentials private and
never commit them.

Yopmail is a receiving/disposable inbox service, not an SMTP sending provider.
Users can request a reset to a valid Yopmail address without special settings;
the configured SMTP provider sends the message, subject to the recipient
provider's delivery rules. The reset link uses the backend `CLIENT_URL`, expires after 15
minutes, and can be used once. Missing SMTP settings or failed connection
verification return a generic service-unavailable response before account
lookup.
If an individual message is rejected after verification, the token is cleared
and the failure is logged without changing the generic reset response, so the
endpoint does not reveal whether an email belongs to an account.

Run `npm run email:verify` from the backend folder to check the SMTP connection.
The verification command reports safe error codes and never prints credentials.
The password-reset URL is generated on the backend from `CLIENT_URL`; it does
not require or expose an SMTP or application URL variable in the frontend.

Register and login return a JWT in `data.token`. Send it on protected API
requests with `Authorization: Bearer <token>`. The same token is also issued in
an `HttpOnly`, `SameSite=Lax` cookie for browser clients; production cookies
use `Secure`. The frontend continues to use the cookie and does not store the
JWT in JavaScript. The configured CORS origin is `CLIENT_URL`. For cross-site
deployments, use a same-site frontend/API hostname or add a CSRF-token strategy
before changing the cookie policy.

## Swagger UI

With the backend running, open [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
for interactive Swagger UI. The machine-readable OpenAPI 3.0 document is
available at [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json).
It documents the root welcome route, health check, and all authentication
endpoints. Register or log in to receive a token, then select **Authorize** in
Swagger UI and enter the token for the Bearer scheme before trying protected
endpoints. Browser clients can continue to use the session cookie.

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

`User.init()` and `Profile.init()` run before the HTTP server starts, ensuring
the unique email and username indexes exist before registration requests are
accepted.

## Production

For local development, set `CLIENT_URL=http://localhost:5173` in
`backend/.env.development`. The frontend's local `VITE_API_BASE_URL=/api`
uses the Vite proxy to reach `http://localhost:5000`.

For the recommended single-origin Render deployment, use the root
[`render.yaml`](../render.yaml) Blueprint. It builds the frontend and backend
and serves the frontend from the API service, preserving the cookie-based
login. The Blueprint configures a persistent media disk and a paid web-service
plan; review Render's current charges before deploying. Rotate any exposed
Atlas password, set the new URI as the Render `MONGO_URI` secret, and keep the
exact public app URL in both `CLIENT_URL` and `PUBLIC_API_URL`. See the root
README for deployment and Atlas network-access steps.

For production, configure environment variables in the backend hosting
provider (do not commit a production `.env` file):

| Backend variable | Production value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | Production MongoDB connection string |
| `JWT_SECRET` | A unique random secret of at least 32 characters |
| `CLIENT_URL` | Exact deployed frontend origin, e.g. `https://your-app.vercel.app` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Values supplied by your outgoing mail provider |
| `SMTP_USER`, `SMTP_PASS` | Credentials for that provider; use a Gmail App Password for Gmail |
| `RESEND_API_KEY` | Optional Resend API key; when set, use `SMTP_FROM` on a Resend-verified domain |
| `SMTP_FROM` | Optional sender address approved by the provider |

In Vercel, set `VITE_API_BASE_URL` to the backend API origin plus `/api`, for
example `https://your-backend.example.com/api`, for the Production environment.
Vite embeds this value at build time, so redeploy after changing it. Set the
backend's `CLIENT_URL` to the exact Vercel frontend origin; this controls both
CORS and password-reset links. Preview deployments need their own matching
`CLIENT_URL` and Vercel environment configuration if they are used for testing.
Never put SMTP credentials in Vercel frontend variables.

The API looks up the normalized registered email, sends to the email address
stored on that account, and returns a generic response for unregistered
addresses. Gmail and other recipient domains do not need SMTP settings of their
own; delivery depends on the configured sender provider accepting the message
and the recipient provider allowing it. A successful SMTP submission does not
guarantee placement in the inbox rather than spam or a later bounce.

Then run the backend:

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
