export interface AppConfig {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  databaseUrl: string;
  mongoUri: string;
  mongoDb: string;
  jwtSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  cronSecret: string;
  voucherClaimLimitPerOffer: number;
  voucherDefaultValidityDays: number;
  verificationCodeTtlSeconds: number;
  membershipExpiryAlertDays: number;
  rateLimit: {
    windowSeconds: number;
    login: number;
    register: number;
    voucherClaim: number;
    codeVerify: number;
  };
  swaggerEnabled: boolean;
  notificationsEnabled: boolean;
  firebaseServiceAccountBase64: string;
}

export const APP_CONFIG = Symbol('APP_CONFIG');

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return value;
}

function int(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Environment variable ${key} must be a non-negative integer`);
  }
  return value;
}

function bool(env: NodeJS.ProcessEnv, key: string, fallback: boolean): boolean {
  const raw = env[key];
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true' || raw === '1';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';
  const jwtSecret = required(env, 'JWT_SECRET');
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  const cronSecret = isProduction ? required(env, 'CRON_SECRET') : (env.CRON_SECRET ?? '');

  return {
    nodeEnv,
    isProduction,
    port: int(env, 'PORT', 3000),
    databaseUrl: required(env, 'DATABASE_URL'),
    mongoUri: required(env, 'MONGODB_URI'),
    mongoDb: env.MONGODB_DB ?? 'bonusclub',
    jwtSecret,
    accessTokenTtlSeconds: int(env, 'ACCESS_TOKEN_TTL_SECONDS', 900),
    refreshTokenTtlSeconds: int(env, 'REFRESH_TOKEN_TTL_SECONDS', 60 * 60 * 24 * 30),
    cronSecret,
    voucherClaimLimitPerOffer: int(env, 'VOUCHER_CLAIM_LIMIT_PER_OFFER', 1),
    voucherDefaultValidityDays: int(env, 'VOUCHER_DEFAULT_VALIDITY_DAYS', 30),
    verificationCodeTtlSeconds: int(env, 'VERIFICATION_CODE_TTL_SECONDS', 300),
    membershipExpiryAlertDays: int(env, 'MEMBERSHIP_EXPIRY_ALERT_DAYS', 7),
    rateLimit: {
      windowSeconds: int(env, 'RATE_LIMIT_WINDOW_SECONDS', 60),
      login: int(env, 'RATE_LIMIT_LOGIN', 10),
      register: int(env, 'RATE_LIMIT_REGISTER', 5),
      voucherClaim: int(env, 'RATE_LIMIT_VOUCHER_CLAIM', 20),
      codeVerify: int(env, 'RATE_LIMIT_CODE_VERIFY', 30),
    },
    swaggerEnabled: bool(env, 'SWAGGER_ENABLED', !isProduction),
    notificationsEnabled: bool(env, 'NOTIFICATIONS_ENABLED', false),
    firebaseServiceAccountBase64: env.FIREBASE_SERVICE_ACCOUNT_BASE64 ?? '',
  };
}
