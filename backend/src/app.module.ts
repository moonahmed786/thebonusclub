import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CronModule } from './modules/cron/cron.module';
import { MembersModule } from './modules/members/members.module';
import { MembershipModule } from './modules/membership/membership.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OffersModule } from './modules/offers/offers.module';
import { PartnersModule } from './modules/partners/partners.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { RequestContextMiddleware } from './shared/request-context.middleware';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    MembersModule,
    MembershipModule,
    PartnersModule,
    OffersModule,
    VouchersModule,
    NotificationsModule,
    AdminModule,
    CronModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*path');
  }
}
