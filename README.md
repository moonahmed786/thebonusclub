# The Bonus Club

Membership app for The Bonus Club. Members register, see their membership status, browse partner offers, claim single-use voucher codes, and receive push alerts.

## Components

| Folder | What it is |
|---|---|
| `frontend/` | React Native mobile app for iOS and Android |
| `backend/` | Node.js REST API with Swagger UI at `/api-docs` |
| `docs/` | Product requirements (`the_bonus_club(PRD).pdf`) |

## Scope

The PRD defines six modules:

1. Authentication and onboarding (email and password, profile, membership tier, admin activation)
2. Digital membership card and verification codes
3. Partner directory and offer browsing
4. Instant voucher claim engine
5. Triggered push notifications (Firebase Cloud Messaging)
6. API management and Swagger docs

## Stack

- **Mobile:** React Native (TypeScript)
- **API:** Node.js REST behind NGINX (TypeScript)
- **PostgreSQL:** users, plans, subscriptions, payments, partners, offers, vouchers
- **MongoDB:** activity logs, audit trails, redemption events
- **Redis:** sessions, caching, rate limiting
- **Push:** Firebase Cloud Messaging

## Status

Early setup. Project rules and the PRD are in place; application code has not been scaffolded yet. Still undecided: Express or NestJS for the API, Hostinger VPS or AWS for hosting.

## Contributing

Read `CLAUDE.md` first, then `backend/CLAUDE.md` or `frontend/CLAUDE.md` for the part you are working on. Never commit `.env` files or credentials; copy `.env.example` and fill in values locally.
