# The Bonus Club API

NestJS 11 REST API, deployed as a Vercel Serverless Function. Rules: `CLAUDE.md` (root) and `backend/CLAUDE.md`.

## Stack

| Concern | Choice |
|---|---|
| Framework | NestJS 11 (Express adapter), TypeScript strict |
| PostgreSQL | Prisma 7 with the `pg` driver adapter; pooled `DATABASE_URL` (Neon/Supabase pooler) |
| MongoDB | Official driver; append-only `audit_events` collection with a JSON-schema validator |
| Redis | `ioredis` over TCP (Upstash `rediss://` in production): sessions, rate limits, partner cache |
| Push | `firebase-admin` (FCM), loaded lazily, off unless `NOTIFICATIONS_ENABLED=true` |
| Docs | Swagger generated from code at `/api-docs` |

## Getting started

```bash
cp .env.example .env          # fill in values
docker compose up -d          # local Postgres, Redis, MongoDB
npm install
npm run migrate:up            # apply Prisma migrations
npm run mongo:setup           # create Mongo collections, validators, indexes
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='a-long-password' npm run db:seed
npm run dev                   # http://localhost:3000/api/v1, docs at /api-docs
```

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Unit tests | `npm test` |
| Integration tests (needs `docker compose up -d`) | `npm run test:e2e` |
| Lint / typecheck | `npm run lint && npm run typecheck` |
| Migrate | `npm run migrate:up` |
| Deploy | `vercel` (preview) / `vercel --prod` (production) |

## API overview (`/api/v1`)

| Module | Endpoints | Auth |
|---|---|---|
| 1. Auth & onboarding | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`; `GET /plans`; `GET/PATCH /members/me`; `PUT /members/me/plan` | Public / member JWT |
| 1. Admin activation | `GET /admin/members`, `POST /admin/members/{id}/activate` | Admin JWT |
| 2. Card & codes | `GET /members/me/card`, `POST /members/me/verification-codes`; `POST /partner/verification-codes/verify` | Member JWT / partner key |
| 3. Partners | `GET /categories`, `GET /partners?category=`, `GET /partners/{id}`, `GET /offers/{id}` | Member JWT |
| 4. Vouchers | `POST /vouchers`, `GET /vouchers`, `GET /vouchers/{id}`; `POST /partner/vouchers/redeem` | Member JWT / partner key |
| 5. Push | `POST /devices`, `POST /devices/unregister` | Member JWT |
| Admin data | `POST /admin/partners`, `POST /admin/partners/{id}/api-key`, `POST /admin/offers`, `PATCH /admin/offers/{id}` | Admin JWT |
| Cron (hidden) | `GET /cron/expire-vouchers`, `GET /cron/membership-expiry-alerts` | `Authorization: Bearer $CRON_SECRET` |

Partner cashiers authenticate with a per-partner API key in the `X-Partner-Key` header. The key is shown once when the partner is created or rotated and is stored only as a SHA-256 hash.

## Key behaviours

- **Member IDs** come from the Postgres sequence `member_id_seq` (`BC-10001`, `BC-10002`, ...).
- **Activation** is idempotent: an already-active member returns `200` with `alreadyActive: true`; a new activation returns `201` and records a subscription and payment reference.
- **Voucher codes** are 12 characters from a 32-symbol alphabet (`crypto.randomInt`). Only a SHA-256 hash and the last 4 characters are stored; the full code is returned once, at claim time.
- **Claiming** locks the member row inside a transaction, so parallel claims cannot exceed `VOUCHER_CLAIM_LIMIT_PER_OFFER`.
- **Redemption** is a single conditional `UPDATE ... WHERE status = 'CLAIMED'`; of two simultaneous redemptions exactly one succeeds (covered by an e2e test).
- **Expiry** runs daily via Vercel Cron (Hobby plan limit; the API already treats past-expiry vouchers as expired) and is safe to run twice.
- **Audit events** go to MongoDB after the Postgres commit; push notifications are sent after commit and never roll anything back.
