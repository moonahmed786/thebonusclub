import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MemberAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { PrismaService } from '../../shared/db/prisma.service';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCode } from '../../shared/errors/error-codes';
import { ApiErrors } from '../../shared/swagger/api-errors';
import { OfferDto } from './dto/offer.dto';
import { liveOfferWhere } from './offer-rules';

@ApiTags('Partners & offers')
@ApiBearerAuth()
@UseGuards(MemberAuthGuard)
@Controller('offers')
export class OffersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Offer detail (live offers only).' })
  @ApiOkResponse({ type: OfferDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED], [404, ErrorCode.OFFER_NOT_FOUND])
  async get(@Param('id', new ParseUUIDPipe()) id: string): Promise<OfferDto> {
    const offer = await this.prisma.client.offer.findFirst({ where: { id, ...liveOfferWhere() } });
    if (!offer) throw AppError.notFound(ErrorCode.OFFER_NOT_FOUND, 'Offer not found');
    return OfferDto.from(offer);
  }
}
