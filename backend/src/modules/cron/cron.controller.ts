import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { VouchersService } from '../vouchers/vouchers.service';
import { CronSecretGuard } from './cron-secret.guard';
import { CronService } from './cron.service';

/** Internal endpoints called by Vercel Cron (see vercel.json). Hidden from Swagger. */
@ApiExcludeController()
@UseGuards(CronSecretGuard)
@Controller('cron')
export class CronController {
  constructor(
    private readonly vouchers: VouchersService,
    private readonly cron: CronService,
  ) {}

  @Get('expire-vouchers')
  expireVouchers(): Promise<{ expired: number }> {
    return this.vouchers.expireDue();
  }

  @Get('purge-expired')
  purgeExpired(): Promise<{ sessions: number; rateLimits: number }> {
    return this.cron.purgeExpired();
  }

  @Get('membership-expiry-alerts')
  membershipExpiryAlerts(): Promise<{ alerted: number }> {
    return this.cron.sendMembershipExpiryAlerts();
  }
}
