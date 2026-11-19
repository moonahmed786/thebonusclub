import { Inject, Injectable } from '@nestjs/common';
import type { Messaging } from 'firebase-admin/messaging';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { PrismaService } from '../../shared/db/prisma.service';
import { AppLogger } from '../../shared/logger/app-logger';

export type PushKind = 'voucher_claimed' | 'voucher_redeemed' | 'membership_expiring';

/** Payloads carry no personal data and no full voucher code. */
export interface PushMessage {
  kind: PushKind;
  title: string;
  body: string;
  /** Deep-link target, e.g. { voucherId } */
  data?: Record<string, string>;
}

const INVALID_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

let cachedMessaging: Messaging | undefined;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /**
   * Sends to every device of the member. Call only after the database commit.
   * Never throws: a failed push must not affect the voucher or membership change.
   */
  async sendToUser(userId: string, message: PushMessage): Promise<void> {
    if (!this.config.notificationsEnabled) return;
    try {
      const messaging = await this.messaging();
      if (!messaging) return;

      const devices = await this.prisma.client.device.findMany({ where: { userId }, select: { fcmToken: true } });
      if (devices.length === 0) return;
      const tokens = devices.map((d) => d.fcmToken);

      const result = await messaging.sendEachForMulticast({
        tokens,
        notification: { title: message.title, body: message.body },
        data: { kind: message.kind, ...(message.data ?? {}) },
      });

      const invalid = result.responses
        .map((r, i) => (r.error && INVALID_TOKEN_ERRORS.has(r.error.code) ? tokens[i] : null))
        .filter((t): t is string => t !== null);
      if (invalid.length > 0) {
        await this.prisma.client.device.deleteMany({ where: { fcmToken: { in: invalid } } });
      }
      this.logger.info('push sent', { memberId: userId, kind: message.kind, success: result.successCount, failed: result.failureCount });
    } catch (err) {
      this.logger.error('push failed', { memberId: userId, kind: message.kind, err: err instanceof Error ? err.message : String(err) });
    }
  }

  private async messaging(): Promise<Messaging | undefined> {
    if (cachedMessaging) return cachedMessaging;
    if (!this.config.firebaseServiceAccountBase64) {
      this.logger.warn('NOTIFICATIONS_ENABLED is true but FIREBASE_SERVICE_ACCOUNT_BASE64 is empty');
      return undefined;
    }
    // Loaded lazily so cold starts that never push do not pay for firebase-admin.
    const { cert, getApps, initializeApp } = await import('firebase-admin/app');
    const { getMessaging } = await import('firebase-admin/messaging');
    const serviceAccount = JSON.parse(Buffer.from(this.config.firebaseServiceAccountBase64, 'base64').toString('utf8'));
    const app = getApps()[0] ?? initializeApp({ credential: cert(serviceAccount) });
    cachedMessaging = getMessaging(app);
    return cachedMessaging;
  }
}
