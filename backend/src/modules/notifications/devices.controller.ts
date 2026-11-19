import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthContext, CurrentUser } from '../../shared/auth/decorators';
import { MemberAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { PrismaService } from '../../shared/db/prisma.service';
import { ErrorCode } from '../../shared/errors/error-codes';
import { ApiErrors } from '../../shared/swagger/api-errors';
import { RegisterDeviceDto, UnregisterDeviceDto } from './dto/device.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(MemberAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Register (or move) this device for push notifications.' })
  @ApiNoContentResponse()
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED])
  async register(@CurrentUser() user: AuthContext, @Body() dto: RegisterDeviceDto): Promise<void> {
    // A token belongs to one device; if another member signed in on it, move it.
    await this.prisma.client.device.upsert({
      where: { fcmToken: dto.fcmToken },
      create: { userId: user.userId, fcmToken: dto.fcmToken, platform: dto.platform },
      update: { userId: user.userId, platform: dto.platform, lastSeenAt: new Date() },
    });
  }

  @Post('unregister')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Stop push notifications to this device (call on logout).' })
  @ApiNoContentResponse()
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED])
  async unregister(@CurrentUser() user: AuthContext, @Body() dto: UnregisterDeviceDto): Promise<void> {
    await this.prisma.client.device.deleteMany({ where: { fcmToken: dto.fcmToken, userId: user.userId } });
  }
}
