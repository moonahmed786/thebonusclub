import { ApiProperty } from '@nestjs/swagger';
import type { Offer } from '../../../generated/prisma/client';

export class OfferDto {
  @ApiProperty() id!: string;
  @ApiProperty() partnerId!: string;
  @ApiProperty({ example: '10% off any fuel purchase' }) title!: string;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;
  @ApiProperty({ nullable: true, type: String, example: 'One voucher per visit. Not valid with other offers.' }) terms!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) startsAt!: string;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) endsAt!: string | null;

  static from(offer: Offer): OfferDto {
    return {
      id: offer.id,
      partnerId: offer.partnerId,
      title: offer.title,
      description: offer.description,
      terms: offer.terms,
      startsAt: offer.startsAt.toISOString(),
      endsAt: offer.endsAt?.toISOString() ?? null,
    };
  }
}
