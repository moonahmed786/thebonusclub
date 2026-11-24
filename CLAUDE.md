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

## 2. Stack & Hostinger Deployment

| Layer | Technology |
|---|---|
| Mobile | React Native CLI (iOS and Android, bare workflow) |
| API | Node.js REST, Express or NestJS (**undecided, see §8**), deployed as Vercel Serverless Functions |
| Relational data | PostgreSQL (Managed: Neon / Supabase) with serverless connection pooling |
| Document data | MongoDB (MongoDB Atlas cloud cluster): logs, audit trails, redemption events |
| Sessions and rate limiting | PostgreSQL tables (`sessions`, `rate_limit_counters`). No Redis. |
| Push | Firebase Cloud Messaging (FCM) only |
| API docs | Swagger / OpenAPI at `/api-docs` |
| Hosting & Infrastructure | Hostinger KVM VPS (Ubuntu LTS) with Docker Compose & NGINX reverse proxy |

### Hostinger VPS Architecture & Ops Guidelines

All backend components run on a single Hostinger KVM VPS containerized with **Docker & Docker Compose**:

- **Reverse Proxy & SSL:** NGINX handles SSL termination (Let's Encrypt / Certbot with automated renewal), rate limiting buffers, and forwards `/api` and `/api-docs` to the Node.js API container.
- **Service Isolation & Networking:**
  - Only ports `80` (HTTP), `443` (HTTPS), and `SSH` are open via UFW.
  - PostgreSQL (`5432`) and MongoDB (`27017`) bind strictly to the internal Docker network, never exposed publicly.
- **Process & Lifecycle Management:**
  - Containers run with `restart: unless-stopped`.
  - Memory and CPU limits defined in `docker-compose.yml` to prevent any single service causing Out-Of-Memory (OOM) kernel kills on the VPS.
  - Docker log rotation enabled (`json-file`, `max-size: 10m`, `max-file: 3`) to avoid exhausting VPS disk space.
- **Data Persistence & Backups:**
  - Persistent Docker named volumes for PostgreSQL data and MongoDB data.
  - Automated backup scripts (cron): daily `pg_dump` and `mongodump` rotated and compressed, supplemented by Hostinger automated VPS snapshots.
- **Environment & Secrets:**
  - Production secrets stored in a server-side `.env` (`chmod 600`) loaded by Docker Compose; never committed to git.

Do not add a new database, queue, or third-party service without asking. Each one needs a cost and ops review.

## 3. Data ownership rules

- **PostgreSQL is the source of truth** for money and entitlement: membership state, payments, voucher issuance and status. If Mongo disagrees with Postgres, Postgres wins.
- **MongoDB is append-mostly.** Use it for logs, audit trails, and redemption event history. Never use it to decide whether a voucher is valid.
- **No Redis.** Login sessions and rate-limit counters live in Postgres. There is no cache layer; read from Postgres directly.
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
- JWT auth for member endpoints. Access tokens short-lived; refresh tokens stored server-side (Postgres `sessions`, hashed) and revocable.
- Admin activation and any admin endpoint require a separate admin role and are not reachable with a member token.
- Rate-limit login, registration, code verification, and voucher claim (Postgres `rate_limit_counters`).
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

1. Backend framework: Express or NestJS?
2. Hosting: **Decided** — Hostinger KVM VPS (Docker Compose + NGINX reverse proxy).
3. Partner cashier redemption: how does a partner's cashier authenticate, if at all? The PRD does not say.
4. Exact "near expiry" window for push alerts.
5. Refund or cancellation handling for off-system payments.
6. Whether members can see voucher history after expiry, and for how long.
