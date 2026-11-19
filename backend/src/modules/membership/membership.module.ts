import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { PlansController } from './plans.controller';

@Module({
  controllers: [PlansController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
