# The Bonus Club Members App — Project Rules

Read this file first. Then read `backend/CLAUDE.md` for API work or `frontend/CLAUDE.md` for mobile work. Source of truth for scope: `docs/the_bonus_club(PRD).pdf`. If code and the PRD disagree, stop and ask before choosing.

## 1. What we are building

A membership app for "The Bonus Club":

- **Mobile app** (React Native, iOS and Android) for members: register, see membership status, browse partner offers, claim single-use voucher codes, get push alerts.
- **Backend REST API** (Node.js) with Swagger UI at `/api-docs`.
- **Admin activation** through a secure API endpoint, used after off-system payment is confirmed.

Scope is locked to the PRD's six modules:

1. Authentication & onboarding (email + password, profile, membership tier, admin activation)
2. Digital membership card & verification codes
3. Partner directory & offer browsing (category filter, partner profile)
4. Instant voucher claim engine (claim, use at POS, lifecycle)
5. Triggered push notifications (FCM)
6. API management & Swagger docs

Anything outside these six needs a PRD change first. Do not add features "while we're here".

## 2. Stack & Vercel Deployment

| Layer | Technology |
|---|---|
| Mobile | React Native CLI (iOS and Android, bare workflow) |
| API | Node.js REST, Express or NestJS (**undecided, see §8**), deployed as Vercel Serverless Functions |
| Relational data | PostgreSQL (Managed: Neon / Supabase) with serverless connection pooling |
| Document data | MongoDB (MongoDB Atlas cloud cluster): logs, audit trails, redemption events |
| Cache and sessions | Redis (Upstash Redis / Vercel KV): session tokens, cache, rate limiting |
| Push | Firebase Cloud Messaging (FCM) only |
| API docs | Swagger / OpenAPI at `/api-docs` |
| Hosting & Platform | Vercel (Serverless Compute & Global Edge Network) + Managed Cloud DBs |

### Vercel Serverless Architecture & Ops Guidelines

All backend API services run as **Vercel Serverless Functions** with cloud-managed data tiers:

- **Routing & SSL:** Handled automatically by Vercel's global edge network (no NGINX). Zero-config SSL/TLS certificate management.
- **Stateless Compute:** API endpoints execute ephemerally.
  - No long-running background daemons or in-memory state.
  - Keep deployment packages and dependencies lean to minimize cold-start latency.
- **Connection Management & Pooling:**
  - **PostgreSQL:** Ephemeral serverless executions can quickly exhaust standard Postgres connections. Must connect via a serverless connection pooler (e.g., Neon connection pooler or Supabase PgBouncer).
  - **MongoDB:** Connect to MongoDB Atlas using a cached singleton connection reused across warm function invocations.
  - **Redis:** Use Upstash Redis (or Vercel KV), designed for serverless environments with REST/HTTP client support or connection-pooled TCP.
- **Scheduled Background Tasks:**
  - Background maintenance (e.g., transitioning expired vouchers from `claimed` to `expired`) runs via **Vercel Cron Jobs** configured in `vercel.json`, calling a secured internal endpoint validated with a `CRON_SECRET` header.
- **Environment & Secrets:**
  - Managed securely in the Vercel Project Settings (or pulled locally via `vercel env pull`). Never commit `.env` files.
- **Local Development:**
  - Emulated locally using `vercel dev` or standard Node dev servers with `.env.local`.

Do not add a new database, queue, or third-party service without asking. Each one needs a cost and ops review.

## 3. Data ownership rules

- **PostgreSQL is the source of truth** for money and entitlement: membership state, payments, voucher issuance and status. If Mongo or Redis disagrees with Postgres, Postgres wins.
- **MongoDB is append-mostly.** Use it for logs, audit trails, and redemption event history. Never use it to decide whether a voucher is valid.
- **Redis is a cache.** Every value in Redis must be rebuildable from Postgres. Losing Redis must not lose data; it may only force users to sign in again or slow requests down.
- Never store full card numbers, CVV, or bank details. Payment is collected off-system; we store only a payment reference and amount if one is needed.

## 4. Business rules (must hold everywhere)

- **Sign-up:** email and password only. No social login, no phone-only sign-up.
- **Membership tiers:**
  - Annual plan: $99
  - Registration $20 + monthly plan
  - Prices come from configuration or the plans table, never hardcoded in screens.
- **Activation:** a new member is **inactive** until an administrator activates them through the activation endpoint after off-system payment. Users cannot activate themselves.
- **Member ID format:** `BC-` followed by digits (example `BC-10293`). Must be unique and never reused.
- **Vouchers:**
  - Each voucher code is unique and **single-use**.
  - A voucher is tied to one active member and one partner offer.
  - States: `Claimed` → `Redeemed` or `Expired`. Transitions are one-way.
  - Redemption must be atomic. Two cashiers or two taps must not both succeed. Use a database transaction or conditional update.
  - Every state change writes an audit record (MongoDB) and the change is in Postgres.
- **Verification codes:** dynamic alphanumeric codes for manual entry or cashier check. They expire and are never reusable after use.
- **Expiry:** a membership near expiry triggers a push alert. Define the "near expiry" window in config, not in code.

## 5. Security (non-negotiable)

- All API traffic over HTTPS only.
- JWT auth for member endpoints. Access tokens short-lived; refresh tokens stored server-side (Redis) and revocable.
- Admin activation and any admin endpoint require a separate admin role and are not reachable with a member token.
- Rate-limit login, registration, code verification, and voucher claim (Redis).
- Hash passwords with a modern algorithm (bcrypt or argon2). Never log passwords, tokens, or full voucher codes.
- Secrets live in environment variables or a secret manager. Never commit `.env`. Never put secrets in the mobile bundle.
- Validate every request body, query, and path parameter against a schema. Return consistent error shapes with correct HTTP status codes.
- Personal data (name, contact, address, birthday) is only returned to the owning member or an admin.

## 6. Conventions

- Language: TypeScript everywhere, strict mode on.
- API responses are JSON with a stable shape. Document every response in Swagger, including error codes.
- Dates in UTC in the API; the app converts to the user's local time for display.
- Currency values are stored as integers in minor units (cents), never floats.
- Names: `camelCase` for variables and functions, `PascalCase` for types and components, `kebab-case` for file names in the API routes folder.
- No commented-out code, no `console.log` in committed code (use the logger).
- Keep changes small and in one module per pull request.

## 7. Working rules for Claude

- Before building a feature, confirm which PRD module it belongs to.
- Ask before adding a dependency, changing the database schema, or changing a business rule in §4.
- Schema changes need a migration file. Never edit a migration that has already run.
- Every new endpoint needs a Swagger entry and at least one test for success and one for the main failure case.
- Never publish, deploy, or send push notifications to real users without explicit approval.

## 8. Open decisions (ask before assuming)

1. Backend framework: Express or NestJS? (Note: wrapped for Vercel serverless execution).
2. Hosting: **Decided** — Vercel Serverless + Managed Cloud DBs (Neon/Supabase Postgres, MongoDB Atlas, Upstash Redis).
3. Partner cashier redemption: how does a partner's cashier authenticate, if at all? The PRD does not say.
4. Exact "near expiry" window for push alerts.
5. Refund or cancellation handling for off-system payments.
6. Whether members can see voucher history after expiry, and for how long.
