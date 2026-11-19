import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentPartner, PartnerContext } from '../../shared/auth/decorators';
import { PartnerApiKeyGuard } from '../../shared/auth/partner-api-key.guard';
import { ErrorCode } from '../../shared/errors/error-codes';
import { RateLimit, RateLimitGuard } from '../../shared/rate-limit/rate-limit.guard';
import { ApiErrors } from '../../shared/swagger/api-errors';
import { RedeemVoucherDto, RedemptionResultDto } from './dto/voucher.dto';
import { VouchersService } from './vouchers.service';

@ApiTags('Partner POS')
@ApiSecurity('partner-key')
@UseGuards(PartnerApiKeyGuard, RateLimitGuard)
@Controller('partner/vouchers')
export class PartnerVouchersController {
  constructor(private readonly vouchers: VouchersService) {}

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  @RateLimit('codeVerify')
  @ApiOperation({ summary: 'Cashier redeems a voucher code at the point of sale. Succeeds at most once per code.' })
  @ApiOkResponse({ type: RedemptionResultDto })
  @ApiErrors(
    [400, ErrorCode.VALIDATION_FAILED],
    [401, ErrorCode.INVALID_API_KEY],
    [404, ErrorCode.VOUCHER_NOT_FOUND],
    [409, ErrorCode.VOUCHER_ALREADY_REDEEMED, ErrorCode.VOUCHER_EXPIRED],
    [429, ErrorCode.RATE_LIMITED],
  )
  redeem(@CurrentPartner() partner: PartnerContext, @Body() dto: RedeemVoucherDto, @Req() req: Request): Promise<RedemptionResultDto> {
    return this.vouchers.redeem(partner.id, dto.code, dto.amountCents, req.requestId);
  }
}
