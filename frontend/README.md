# The Bonus Club — Member App

Bare React Native CLI app (iOS and Android), TypeScript strict. Rules: `CLAUDE.md` (root) and `frontend/CLAUDE.md`.

| Concern | Choice |
|---|---|
| React Native | 0.88 (bare workflow), bundle ID / package `com.thebonusclub.app` |
| Navigation | React Navigation 7 (native stack + bottom tabs) |
| Server data | TanStack Query 5 |
| API client | Types generated from the backend Swagger spec (`openapi-typescript`) + `openapi-fetch` |
| Secure storage | `react-native-keychain` (Keychain / Keystore): tokens, last-known card, claimed voucher codes |
| Push | `@react-native-firebase/app` + `messaging` (FCM) |

## Setup

Prerequisites: Node 22+, Xcode + CocoaPods (iOS), Android Studio + SDK (Android).

```bash
npm install
cd ios && bundle install && bundle exec pod install && cd ..
```

Firebase config files are **not committed** (see `.gitignore`). Download them from the Firebase console and place them at:

- `android/app/google-services.json`
- `ios/TheBonusClub/GoogleService-Info.plist` (also add it to the Xcode target)

For iOS push, enable the **Push Notifications** capability in Xcode (Signing & Capabilities) and upload the APNs key (`.p8`) to Firebase.

The API base URL is in `src/config/env.ts` (no secrets in the app).

## Commands

| Task | Command |
|---|---|
| Metro | `npm start` |
| Run Android / iOS | `npm run android` / `npm run ios` |
| Tests | `npm test` |
| Lint / typecheck | `npm run lint && npm run typecheck` |
| Regenerate API types | `npm run api:types` (or `API_SPEC_URL=http://localhost:3000/api-docs-json npm run api:types`) |

## Structure

```
src/
  app/            App root, navigation tree, route types
  config/         Public config (API base URL)
  features/
    auth/         Login, register, session provider
    onboarding/   Profile setup, choose plan, awaiting activation
    membership/   Digital card (offline-capable), verification codes
    partners/     Category filter, partner list/profile, offer detail
    vouchers/     Claim button, voucher list/detail, code display
    notifications/ Permission prompt, FCM token registration, notification taps
  shared/
    api/          Generated schema, typed client with one-time token refresh, error messages
    components/   Button, TextField, Screen, Card, StatusBadge, LogoImage, state views
    storage/      Secure-store helpers
    theme/        Light/dark theme
    utils/        Date and money formatting
__tests__/        Unit and component tests
```

## Flow

1. Sign in or register (email + password).
2. Inactive members: profile details → choose plan → "awaiting activation" (pull to refresh).
3. Active (or expired) members: tabs for **Card** (with verification code), **Partners** (category filter → partner → offer → Claim Voucher Code), and **Vouchers** (Claimed / Redeemed / Expired).
4. After sign-in the app explains notifications, then asks for permission and registers the FCM token. Tapping a notification opens the voucher or card.
