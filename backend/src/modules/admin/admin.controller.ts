import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthContext, CurrentUser } from '../../shared/auth/decorators';
import { AdminAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { ErrorCode } from '../../shared/errors/error-codes';
import { ApiErrors } from '../../shared/swagger/api-errors';
import { MembershipService } from '../membership/membership.service';
import { OfferDto } from '../offers/dto/offer.dto';
import { AdminService } from './admin.service';
import {
  ActivateMemberDto,
  ActivationResponseDto,
  AdminMemberListDto,
  AdminMemberListQueryDto,
  CreateOfferDto,
  CreatePartnerDto,
  PartnerCreatedDto,
  UpdateOfferDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly membership: MembershipService,
  ) {}

  @Get('members')
  @ApiOperation({ summary: 'List members, e.g. inactive members awaiting activation.' })
  @ApiOkResponse({ type: AdminMemberListDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED], [403, ErrorCode.FORBIDDEN])
  listMembers(@Query() q: AdminMemberListQueryDto): Promise<AdminMemberListDto> {
    return this.admin.listMembers(q.status, q.search, q.page ?? 1, q.pageSize ?? 20);
  }

  @Post('members/:id/activate')
  @ApiOperation({
    summary: 'Activate a member after off-system payment is confirmed. Idempotent: returns 200 if already active, 201 when activated.',
  })
  @ApiCreatedResponse({ type: ActivationResponseDto, description: 'Member activated (or renewed)' })
  @ApiOkResponse({ type: ActivationResponseDto, description: 'Member was already active; nothing changed' })
  @ApiErrors(
    [400, ErrorCode.VALIDATION_FAILED],
    [401, ErrorCode.UNAUTHENTICATED],
    [403, ErrorCode.FORBIDDEN],
    [404, ErrorCode.MEMBER_NOT_FOUND],
    [409, ErrorCode.PAYMENT_REFERENCE_USED],
    [422, ErrorCode.PLAN_REQUIRED, ErrorCode.PLAN_NOT_FOUND],
  )
  async activate(
    @CurrentUser() auth: AuthContext,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ActivateMemberDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ActivationResponseDto> {
    const result = await this.membership.activate({
      memberId: id,
      adminId: auth.userId,
      paymentReference: dto.paymentReference,
      amountCents: dto.amountCents,
      planCode: dto.planCode,
      requestId: req.requestId,
    });
    res.status(result.alreadyActive ? HttpStatus.OK : HttpStatus.CREATED);
    return result;
  }

  @Post('partners')
  @ApiOperation({ summary: 'Create a partner. Returns its POS API key once.' })
  @ApiCreatedResponse({ type: PartnerCreatedDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED], [403, ErrorCode.FORBIDDEN], [422, ErrorCode.CATEGORY_NOT_FOUND])
  createPartner(@CurrentUser() auth: AuthContext, @Body() dto: CreatePartnerDto, @Req() req: Request): Promise<PartnerCreatedDto> {
    return this.admin.createPartner(auth.userId, dto, req.requestId);
  }

  @Post('partners/:id/api-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate a partner's POS API key. The old key stops working immediately." })
  @ApiOkResponse({ type: PartnerCreatedDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED], [403, ErrorCode.FORBIDDEN], [404, ErrorCode.PARTNER_NOT_FOUND])
  rotateKey(@CurrentUser() auth: AuthContext, @Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request): Promise<PartnerCreatedDto> {
    return this.admin.rotatePartnerApiKey(auth.userId, id, req.requestId);
  }

  @Post('offers')
  @ApiOperation({ summary: 'Create an offer for a partner.' })
  @ApiCreatedResponse({ type: OfferDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED], [403, ErrorCode.FORBIDDEN], [404, ErrorCode.PARTNER_NOT_FOUND])
  createOffer(@CurrentUser() auth: AuthContext, @Body() dto: CreateOfferDto, @Req() req: Request): Promise<OfferDto> {
    return this.admin.createOffer(auth.userId, dto, req.requestId);
  }

  @Patch('offers/:id')
  @ApiOperation({ summary: 'Pause/resume an offer or change its end date.' })
  @ApiOkResponse({ type: OfferDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED], [403, ErrorCode.FORBIDDEN], [404, ErrorCode.OFFER_NOT_FOUND])
  updateOffer(
    @CurrentUser() auth: AuthContext,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOfferDto,
    @Req() req: Request,
  ): Promise<OfferDto> {
    return this.admin.updateOffer(auth.userId, id, dto, req.requestId);
  }
}
