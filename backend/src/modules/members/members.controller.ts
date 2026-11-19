import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthContext, CurrentUser } from '../../shared/auth/decorators';
import { MemberAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { PrismaService } from '../../shared/db/prisma.service';
import { ErrorCode } from '../../shared/errors/error-codes';
import { membershipState } from '../../shared/membership-status';
import { ApiErrors } from '../../shared/swagger/api-errors';
import { SelectPlanDto } from '../membership/dto/membership.dto';
import { MembershipService } from '../membership/membership.service';
import { MemberDto } from './dto/member.dto';
import { MembershipCardDto, UpdateProfileDto, VerificationCodeDto } from './dto/profile.dto';
import { VerificationCodesService } from './verification-codes.service';

@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(MemberAuthGuard)
@Controller('members/me')
export class MembersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    private readonly verificationCodes: VerificationCodesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get my profile and membership status.' })
  @ApiOkResponse({ type: MemberDto })
  @ApiErrors([401, ErrorCode.UNAUTHENTICATED])
  async me(@CurrentUser() auth: AuthContext): Promise<MemberDto> {
    const user = await this.prisma.client.user.findUniqueOrThrow({ where: { id: auth.userId }, include: { plan: true } });
    return MemberDto.from(user);
  }

  @Patch()
  @ApiOperation({ summary: 'Update my profile (name, contact, address, birthday).' })
  @ApiOkResponse({ type: MemberDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED])
  async update(@CurrentUser() auth: AuthContext, @Body() dto: UpdateProfileDto): Promise<MemberDto> {
    const user = await this.prisma.client.user.update({
      where: { id: auth.userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        address: dto.address,
        birthday: dto.birthday ? new Date(`${dto.birthday}T00:00:00Z`) : undefined,
      },
      include: { plan: true },
    });
    return MemberDto.from(user);
  }

  @Put('plan')
  @ApiOperation({ summary: 'Choose my membership tier. Only allowed before activation.' })
  @ApiOkResponse({ type: MemberDto })
  @ApiErrors(
    [400, ErrorCode.VALIDATION_FAILED],
    [401, ErrorCode.UNAUTHENTICATED],
    [422, ErrorCode.PLAN_NOT_FOUND, ErrorCode.PLAN_CHANGE_NOT_ALLOWED],
  )
  selectPlan(@CurrentUser() auth: AuthContext, @Body() dto: SelectPlanDto, @Req() req: Request): Promise<MemberDto> {
    return this.membership.selectPlan(auth.userId, dto.planCode, req.requestId);
  }

  @Get('card')
  @ApiOperation({ summary: 'Digital membership card.' })
  @ApiOkResponse({ type: MembershipCardDto })
  @ApiErrors([401, ErrorCode.UNAUTHENTICATED])
  async card(@CurrentUser() auth: AuthContext): Promise<MembershipCardDto> {
    const user = await this.prisma.client.user.findUniqueOrThrow({ where: { id: auth.userId }, include: { plan: true } });
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return {
      name: name || null,
      memberId: user.memberId,
      membershipStatus: membershipState(user),
      expiresAt: user.expiresAt?.toISOString() ?? null,
      planName: user.plan?.name ?? null,
    };
  }

  @Post('verification-codes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Get a fresh single-use verification code for a cashier check. Active members only.' })
  @ApiCreatedResponse({ type: VerificationCodeDto })
  @ApiErrors([401, ErrorCode.UNAUTHENTICATED], [403, ErrorCode.MEMBERSHIP_INACTIVE])
  issueCode(@CurrentUser() auth: AuthContext): Promise<VerificationCodeDto> {
    return this.verificationCodes.issue(auth.userId);
  }
}
