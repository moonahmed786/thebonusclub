import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { CronController } from './cron.controller';
import { CronSecretGuard } from './cron-secret.guard';
import { CronService } from './cron.service';

@Module({
  imports: [VouchersModule, NotificationsModule],
  controllers: [CronController],
  providers: [CronService, CronSecretGuard],
})
export class CronModule {}
