import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { PrismaService } from '../../shared/db/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const ALERT_BATCH_SIZE = 200;

@Injectable()
export class CronService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /** Push "membership expiring soon" once per membership term. Safe to run twice. */
  async sendMembershipExpiryAlerts(): Promise<{ alerted: number }> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + this.config.membershipExpiryAlertDays * DAY_MS);
    const due = await this.prisma.client.user.findMany({
      where: { role: 'MEMBER', status: 'ACTIVE', expiryAlertSentAt: null, expiresAt: { gt: now, lte: windowEnd } },
      select: { id: true, expiresAt: true },
      take: ALERT_BATCH_SIZE,
    });

    let alerted = 0;
    for (const user of due) {
      // Claim the alert first so two overlapping runs cannot both send it.
      const claimed = await this.prisma.client.user.updateMany({
        where: { id: user.id, expiryAlertSentAt: null },
        data: { expiryAlertSentAt: now },
      });
      if (claimed.count === 0) continue;
      const days = Math.max(1, Math.ceil(((user.expiresAt?.getTime() ?? now.getTime()) - now.getTime()) / DAY_MS));
      await this.notifications.sendToUser(user.id, {
        kind: 'membership_expiring',
        title: 'Membership expiring soon',
        body: `Your Bonus Club membership expires in ${days} day${days === 1 ? '' : 's'}.`,
        data: { screen: 'card' },
      });
      alerted += 1;
    }
    return { alerted };
  }
}
