import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import type { Offer, Partner, Voucher } from '../../../generated/prisma/client';

export type VoucherStatusValue = 'claimed' | 'redeemed' | 'expired';

export class ClaimVoucherDto {
  @ApiProperty({ description: 'Offer to claim a voucher for' })
  @IsUUID()
  offerId!: string;
}

export class VoucherDto {
  @ApiProperty() id!: string;
  @ApiProperty() offerId!: string;
  @ApiProperty({ example: '10% off any fuel purchase' }) offerTitle!: string;
  @ApiProperty() partnerId!: string;
  @ApiProperty({ example: 'Shell Main Street' }) partnerName!: string;
  @ApiProperty({ enum: ['claimed', 'redeemed', 'expired'] }) status!: VoucherStatusValue;
  @ApiProperty({ example: '7KQ2', description: 'Last 4 characters of the code, for display' }) codeLast4!: string;
  @ApiProperty({ type: String, format: 'date-time' }) claimedAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: string;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) redeemedAt!: string | null;

  static from(v: Voucher & { offer: Offer; partner: Partner }, now: Date = new Date()): VoucherDto {
    // A claimed voucher past its expiry is reported as expired even before the cron job runs.
    const status: VoucherStatusValue =
      v.status === 'CLAIMED' && v.expiresAt.getTime() <= now.getTime() ? 'expired' : (v.status.toLowerCase() as VoucherStatusValue);
    return {
      id: v.id,
      offerId: v.offerId,
      offerTitle: v.offer.title,
      partnerId: v.partnerId,
      partnerName: v.partner.name,
      status,
      codeLast4: v.codeLast4,
      claimedAt: v.claimedAt.toISOString(),
      expiresAt: v.expiresAt.toISOString(),
      redeemedAt: v.redeemedAt?.toISOString() ?? null,
    };
  }
}

export class ClaimedVoucherDto extends VoucherDto {
  @ApiProperty({
    example: 'K7PX-3MQ9-T2WD',
    description: 'Full single-use code. Returned only once, at claim time; store it on the device.',
  })
  code!: string;
}

export class VoucherListQueryDto {
  @ApiPropertyOptional({ enum: ['claimed', 'redeemed', 'expired'] })
  @IsOptional() @IsEnum(['claimed', 'redeemed', 'expired'])
  status?: VoucherStatusValue;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize?: number;
}

export class VoucherListDto {
  @ApiProperty({ type: [VoucherDto] }) items!: VoucherDto[];
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() total!: number;
}

export class RedeemVoucherDto {
  @ApiProperty({ example: 'K7PX-3MQ9-T2WD', description: 'Code shown by the member (dashes and case ignored)' })
  @IsString()
  @Length(8, 30)
  code!: string;

  @ApiPropertyOptional({ example: 4599, description: 'Bill amount in cents, if the partner records it' })
  @IsOptional() @IsInt() @Min(0) @Max(100_000_000)
  amountCents?: number;
}

export class RedemptionResultDto {
  @ApiProperty() voucherId!: string;
  @ApiProperty({ example: '10% off any fuel purchase' }) offerTitle!: string;
  @ApiProperty({ example: 'BC-10293' }) memberId!: string;
  @ApiProperty({ type: String, format: 'date-time' }) redeemedAt!: string;
}
