import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsISO8601, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { MemberDto } from '../../members/dto/member.dto';

const trimLower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto {
  @ApiProperty({ example: 'jane@example.com' })
  @Transform(trimLower)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'correct-horse-battery', minLength: 8, maxLength: 72 })
  @IsString()
  @Length(8, 72)
  password!: string;

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

  @ApiPropertyOptional({ example: 'ANNUAL', description: 'Plan code from GET /plans' })
  @IsOptional() @IsString() @MaxLength(50)
  planCode?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'jane@example.com' })
  @Transform(trimLower)
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'correct-horse-battery' })
  @IsString()
  @Length(1, 72)
  password!: string;
}

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token from login/register/refresh' })
  @IsString()
  @Length(10, 200)
  refreshToken!: string;
}

export class TokensDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty({ example: 900, description: 'Access token lifetime in seconds' }) expiresIn!: number;
  @ApiProperty({ enum: ['MEMBER', 'ADMIN'] }) role!: 'MEMBER' | 'ADMIN';
}

export class AuthResponseDto {
  @ApiProperty({ type: TokensDto }) tokens!: TokensDto;
  @ApiProperty({ type: MemberDto }) member!: MemberDto;
}
