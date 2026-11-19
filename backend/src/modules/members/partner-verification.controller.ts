import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentPartner, PartnerContext } from '../../shared/auth/decorators';
import { PartnerApiKeyGuard } from '../../shared/auth/partner-api-key.guard';
import { ErrorCode } from '../../shared/errors/error-codes';
import { RateLimit, RateLimitGuard } from '../../shared/rate-limit/rate-limit.guard';
import { ApiErrors } from '../../shared/swagger/api-errors';
import { VerificationResultDto, VerifyCodeDto } from './dto/profile.dto';
import { VerificationCodesService } from './verification-codes.service';

@ApiTags('Partner POS')
@ApiSecurity('partner-key')
@UseGuards(PartnerApiKeyGuard, RateLimitGuard)
@Controller('partner/verification-codes')
export class PartnerVerificationController {
  constructor(private readonly verificationCodes: VerificationCodesService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @RateLimit('codeVerify')
  @ApiOperation({ summary: "Cashier checks a member's verification code. The code is used up by this call." })
  @ApiOkResponse({ type: VerificationResultDto })
  @ApiErrors(
    [400, ErrorCode.VALIDATION_FAILED],
    [401, ErrorCode.INVALID_API_KEY],
    [404, ErrorCode.VERIFICATION_CODE_INVALID],
    [429, ErrorCode.RATE_LIMITED],
  )
  verify(@CurrentPartner() partner: PartnerContext, @Body() dto: VerifyCodeDto, @Req() req: Request): Promise<VerificationResultDto> {
    return this.verificationCodes.verify(dto.code, partner.id, req.requestId);
  }
}
