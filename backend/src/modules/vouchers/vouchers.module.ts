import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PartnerVouchersController } from './partner-vouchers.controller';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';

@Module({
  imports: [NotificationsModule],
  controllers: [VouchersController, PartnerVouchersController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
