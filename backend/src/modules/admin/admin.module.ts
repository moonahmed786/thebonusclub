import { Module } from '@nestjs/common';
import { MembershipModule } from '../membership/membership.module';
import { PartnersModule } from '../partners/partners.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [MembershipModule, PartnersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
