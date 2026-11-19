import { Module } from '@nestjs/common';
import { MembershipModule } from '../membership/membership.module';
import { MembersController } from './members.controller';
import { PartnerVerificationController } from './partner-verification.controller';
import { VerificationCodesService } from './verification-codes.service';

@Module({
  imports: [MembershipModule],
  controllers: [MembersController, PartnerVerificationController],
  providers: [VerificationCodesService],
})
export class MembersModule {}
