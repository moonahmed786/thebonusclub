import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MemberAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { ErrorCode } from '../../shared/errors/error-codes';
import { ApiErrors } from '../../shared/swagger/api-errors';
import { CategoryDto, PartnerDetailDto, PartnerListDto, PartnerListQueryDto } from './dto/partner.dto';
import { PartnersService } from './partners.service';

@ApiTags('Partners & offers')
@ApiBearerAuth()
@UseGuards(MemberAuthGuard)
@Controller()
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Partner categories (Fuel, Groceries, Dining, ...).' })
  @ApiOkResponse({ type: [CategoryDto] })
  @ApiErrors([401, ErrorCode.UNAUTHENTICATED])
  categories(): Promise<CategoryDto[]> {
    return this.partners.listCategories();
  }

  @Get('partners')
  @ApiOperation({ summary: 'Partner directory, optionally filtered by category.' })
  @ApiOkResponse({ type: PartnerListDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED], [404, ErrorCode.CATEGORY_NOT_FOUND])
  list(@Query() query: PartnerListQueryDto): Promise<PartnerListDto> {
    return this.partners.listPartners(query.category, query.page ?? 1, query.pageSize ?? 20);
  }

  @Get('partners/:id')
  @ApiOperation({ summary: 'Partner profile with its live offers.' })
  @ApiOkResponse({ type: PartnerDetailDto })
  @ApiErrors([400, ErrorCode.VALIDATION_FAILED], [401, ErrorCode.UNAUTHENTICATED], [404, ErrorCode.PARTNER_NOT_FOUND])
  get(@Param('id', new ParseUUIDPipe()) id: string): Promise<PartnerDetailDto> {
    return this.partners.getPartner(id);
  }
}
