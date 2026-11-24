// Public configuration only. Never put secrets in the app bundle.
export const config = {
  apiBaseUrl: 'https://thebonusclub-backend.vercel.app',
  /** How long the partner directory stays fresh before refetching (ms). */
  partnerListStaleMs: 5 * 60 * 1000,
} as const;
