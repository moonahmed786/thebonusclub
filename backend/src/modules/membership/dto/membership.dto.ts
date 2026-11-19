import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SelectPlanDto {
  @ApiProperty({ example: 'ANNUAL', description: 'Plan code from GET /plans' })
  @IsString()
  @MaxLength(50)
  planCode!: string;
}
