import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthContext, CurrentUser } from '../../shared/auth/decorators';
import { AnyUserAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { ErrorCode } from '../../shared/errors/error-codes';
import { RateLimit, RateLimitGuard } from '../../shared/rate-limit/rate-limit.guard';
import { ApiErrors } from '../../shared/swagger/api-errors';
import { AuthService } from './auth.service';
import { AuthResponseDto, LoginDto, RefreshDto, RegisterDto, TokensDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @UseGuards(RateLimitGuard)
  @RateLimit('register')
  @ApiOperation({ summary: 'Register with email and password. New members start inactive until an admin activates them.' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiErrors(
    [400, ErrorCode.VALIDATION_FAILED],
    [409, ErrorCode.EMAIL_TAKEN],
    [422, ErrorCode.PLAN_NOT_FOUND],
    [429, ErrorCode.RATE_LIMITED],
  )
  register(@Body() dto: RegisterDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.auth.register(dto, req.requestId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit('login')
  @ApiOperation({ summary: 'Sign in. Returns a short-lived access token and a refresh token.' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.INVALID_CREDENTIALS], [429, ErrorCode.RATE_LIMITED])
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit('login')
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair. The old refresh token stops working.' })
  @ApiOkResponse({ type: TokensDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.INVALID_REFRESH_TOKEN])
  refresh(@Body() dto: RefreshDto): Promise<TokensDto> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AnyUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End the current session and revoke its refresh token.' })
  @ApiNoContentResponse()
  @ApiErrors([401, ErrorCode.UNAUTHENTICATED])
  async logout(@CurrentUser() user: AuthContext): Promise<void> {
    await this.auth.logout(user.sessionId, user.userId);
  }
}
