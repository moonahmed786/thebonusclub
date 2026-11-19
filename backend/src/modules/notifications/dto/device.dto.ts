import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Length } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'FCM registration token' })
  @IsString()
  @Length(20, 4096)
  fcmToken!: string;

  @ApiProperty({ enum: ['IOS', 'ANDROID'] })
  @IsEnum(['IOS', 'ANDROID'])
  platform!: 'IOS' | 'ANDROID';
}

export class UnregisterDeviceDto {
  @ApiProperty({ description: 'FCM registration token to remove' })
  @IsString()
  @Length(20, 4096)
  fcmToken!: string;
}
