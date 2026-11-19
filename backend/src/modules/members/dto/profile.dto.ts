import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsOptional, IsString, Length, Matches } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional() @Transform(trim) @IsString() @Length(1, 100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional() @Transform(trim) @IsString() @Length(1, 100)
  lastName?: string;

  @ApiPropertyOptional({ example: '+1 555 0100' })
  @IsOptional() @Transform(trim) @IsString() @Matches(/^[+0-9 ()-]{6,20}$/)
  phone?: string;

  @ApiPropertyOptional({ example: '1 Main St, Springfield' })
  @IsOptional() @Transform(trim) @IsString() @Length(1, 300)
  address?: string;

  @ApiPropertyOptional({ example: '1990-04-12', description: 'YYYY-MM-DD' })
  @IsOptional() @IsISO8601({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthday?: string;
}

export class MembershipCardDto {
  @ApiProperty({ example: 'Jane Doe', nullable: true, type: String }) name!: string | null;
  @ApiProperty({ example: 'BC-10293' }) memberId!: string;
  @ApiProperty({ enum: ['active', 'inactive', 'expired'] }) membershipStatus!: 'active' | 'inactive' | 'expired';
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) expiresAt!: string | null;
  @ApiProperty({ nullable: true, example: 'Annual membership', type: String }) planName!: string | null;
}

export class VerificationCodeDto {
  @ApiProperty({ example: 'K7PX-3MQ9', description: 'Show to the cashier. Single use.' }) code!: string;
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: string;
}

export class VerifyCodeDto {
  @ApiProperty({ example: 'K7PX-3MQ9' })
  @IsString()
  @Length(4, 20)
  code!: string;
}

/** What a partner sees when checking a member's code: no personal data. */
export class VerificationResultDto {
  @ApiProperty({ example: 'BC-10293' }) memberId!: string;
  @ApiProperty({ enum: ['active', 'inactive', 'expired'] }) membershipStatus!: 'active' | 'inactive' | 'expired';
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) expiresAt!: string | null;
}
