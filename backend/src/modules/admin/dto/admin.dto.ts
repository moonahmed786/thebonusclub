import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsISO8601, IsOptional, IsString, IsUrl, IsUUID, Length, Matches, Max, MaxLength, Min } from 'class-validator';
import { MemberDto } from '../../members/dto/member.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class ActivateMemberDto {
  @ApiProperty({ example: 'BANK-TRX-2026-000123', description: 'Reference of the confirmed off-system payment' })
  @Transform(trim) @IsString() @Length(3, 100)
  paymentReference!: string;

  @ApiProperty({ example: 9900, description: 'Amount received, in cents' })
  @IsInt() @Min(0) @Max(100_000_000)
  amountCents!: number;

  @ApiPropertyOptional({ example: 'ANNUAL', description: "Defaults to the member's chosen plan" })
  @IsOptional() @IsString() @MaxLength(50)
  planCode?: string;
}

export class ActivationResponseDto {
  @ApiProperty({ type: MemberDto }) member!: MemberDto;
  @ApiProperty({ description: 'True when the member was already active and nothing changed' }) alreadyActive!: boolean;
}

export class AdminMemberListQueryDto {
  @ApiPropertyOptional({ enum: ['INACTIVE', 'ACTIVE'] })
  @IsOptional() @IsEnum(['INACTIVE', 'ACTIVE'])
  status?: 'INACTIVE' | 'ACTIVE';

  @ApiPropertyOptional({ example: 'BC-10293', description: 'Exact member ID or email' })
  @IsOptional() @Transform(trim) @IsString() @MaxLength(254)
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize?: number;
}

export class AdminMemberListDto {
  @ApiProperty({ type: [MemberDto] }) items!: MemberDto[];
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() total!: number;
}

export class CreatePartnerDto {
  @ApiProperty({ example: 'Shell Main Street' })
  @Transform(trim) @IsString() @Length(1, 200)
  name!: string;

  @ApiProperty({ example: 'fuel', description: 'Category slug' })
  @IsString() @Matches(/^[a-z0-9-]{1,50}$/)
  categorySlug!: string;

  @ApiProperty({ example: 'Show the voucher code to the cashier before paying.' })
  @Transform(trim) @IsString() @Length(1, 500)
  redemptionMethod!: string;

  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(2000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ protocols: ['https'], require_protocol: true }) logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(300) address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^[+0-9 ()-]{6,20}$/) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ protocols: ['https', 'http'], require_protocol: true }) website?: string;
}

export class PartnerCreatedDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ description: 'POS API key. Shown only once; send it in the X-Partner-Key header.' }) apiKey!: string;
}

export class CreateOfferDto {
  @ApiProperty() @IsUUID() partnerId!: string;
  @ApiProperty({ example: '10% off any fuel purchase' }) @Transform(trim) @IsString() @Length(1, 200) title!: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(2000) description?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(2000) terms?: string;
  @ApiProperty({ type: String, format: 'date-time' }) @IsISO8601() startsAt!: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' }) @IsOptional() @IsISO8601() endsAt?: string;
  @ApiPropertyOptional({ example: 30 }) @IsOptional() @IsInt() @Min(1) @Max(365) voucherValidityDays?: number;
}

export class UpdateOfferDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPaused?: boolean;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) @IsOptional() @IsISO8601() endsAt?: string;
}
