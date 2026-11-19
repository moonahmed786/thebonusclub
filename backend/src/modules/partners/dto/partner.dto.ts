import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import type { Category, Offer, Partner } from '../../../generated/prisma/client';
import { OfferDto } from '../../offers/dto/offer.dto';

export class CategoryDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'fuel' }) slug!: string;
  @ApiProperty({ example: 'Fuel' }) name!: string;

  static from(c: Category): CategoryDto {
    return { id: c.id, slug: c.slug, name: c.name };
  }
}

export class PartnerSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'Shell Main Street' }) name!: string;
  @ApiProperty({ type: CategoryDto }) category!: CategoryDto;
  @ApiProperty({ nullable: true, type: String }) logoUrl!: string | null;
  @ApiProperty({ example: 2 }) liveOfferCount!: number;
}

export class PartnerDetailDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: CategoryDto }) category!: CategoryDto;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;
  @ApiProperty({ nullable: true, type: String }) logoUrl!: string | null;
  @ApiProperty({ nullable: true, type: String }) address!: string | null;
  @ApiProperty({ nullable: true, type: String }) phone!: string | null;
  @ApiProperty({ nullable: true, type: String }) email!: string | null;
  @ApiProperty({ nullable: true, type: String }) website!: string | null;
  @ApiProperty({ example: 'Show the voucher code to the cashier before paying.' }) redemptionMethod!: string;
  @ApiProperty({ type: [OfferDto] }) offers!: OfferDto[];

  static from(p: Partner & { category: Category; offers: Offer[] }): PartnerDetailDto {
    return {
      id: p.id,
      name: p.name,
      category: CategoryDto.from(p.category),
      description: p.description,
      logoUrl: p.logoUrl,
      address: p.address,
      phone: p.phone,
      email: p.email,
      website: p.website,
      redemptionMethod: p.redemptionMethod,
      offers: p.offers.map(OfferDto.from),
    };
  }
}

export class PartnerListQueryDto {
  @ApiPropertyOptional({ example: 'fuel', description: 'Category slug' })
  @IsOptional() @IsString() @Matches(/^[a-z0-9-]{1,50}$/)
  category?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize?: number;
}

export class PartnerListDto {
  @ApiProperty({ type: [PartnerSummaryDto] }) items!: PartnerSummaryDto[];
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) pageSize!: number;
  @ApiProperty({ example: 42 }) total!: number;
}
