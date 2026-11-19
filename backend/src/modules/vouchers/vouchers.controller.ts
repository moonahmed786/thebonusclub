import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthContext, CurrentUser } from '../../shared/auth/decorators';
import { MemberAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { ErrorCode } from '../../shared/errors/error-codes';
import { RateLimit, RateLimitGuard } from '../../shared/rate-limit/rate-limit.guard';
import { ApiErrors } from '../../shared/swagger/api-errors';
import { ClaimedVoucherDto, ClaimVoucherDto, VoucherDto, VoucherListDto, VoucherListQueryDto } from './dto/voucher.dto';
import { VouchersService } from './vouchers.service';

@ApiTags('Vouchers')
@ApiBearerAuth()
@UseGuards(MemberAuthGuard, RateLimitGuard)
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchers: VouchersService) {}

  @Post()
  @RateLimit('voucherClaim')
  @ApiOperation({ summary: 'Claim a single-use voucher code for an offer. The full code is returned only in this response.' })
  @ApiCreatedResponse({ type: ClaimedVoucherDto })
  @ApiErrors(
    [400, ErrorCode.VALIDATION_FAILED],
    [401, ErrorCode.UNAUTHENTICATED],
    [403, ErrorCode.MEMBERSHIP_INACTIVE],
    [404, ErrorCode.OFFER_NOT_FOUND],
    [422, ErrorCode.OFFER_NOT_AVAILABLE, ErrorCode.VOUCHER_CLAIM_LIMIT_REACHED],
    [429, ErrorCode.RATE_LIMITED],
  )
  claim(@CurrentUser() auth: AuthContext, @Body() dto: ClaimVoucherDto, @Req() req: Request): Promise<ClaimedVoucherDto> {
    return this.vouchers.claim(auth.userId, dto.offerId, req.requestId);
  }

  @Get()
  @ApiOperation({ summary: 'My vouchers, newest first, optionally filtered by status.' })
  @ApiOkResponse({ type: VoucherListDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED])
  list(@CurrentUser() auth: AuthContext, @Query() query: VoucherListQueryDto): Promise<VoucherListDto> {
    return this.vouchers.listForMember(auth.userId, query.status, query.page ?? 1, query.pageSize ?? 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One of my vouchers (status and details; the full code is not returned).' })
  @ApiOkResponse({ type: VoucherDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED], [404, ErrorCode.VOUCHER_NOT_FOUND])
  get(@CurrentUser() auth: AuthContext, @Param('id', new ParseUUIDPipe()) id: string): Promise<VoucherDto> {
    return this.vouchers.getForMember(auth.userId, id);
  }
}
