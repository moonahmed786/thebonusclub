import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { ErrorCode } from '../errors/error-codes';

class ErrorDetail {
  @ApiProperty({ enum: Object.values(ErrorCode), example: ErrorCode.VALIDATION_FAILED })
  code!: string;

  @ApiProperty({ example: 'Request validation failed' })
  message!: string;

  @ApiProperty({ example: '7f1c2a9e-3b4d-4c6e-9f10-2a3b4c5d6e7f' })
  requestId!: string;

  @ApiProperty({ required: false, type: [String], example: ['email must be an email'] })
  details?: string[];
}

export class ErrorResponseDto {
  @ApiProperty({ type: ErrorDetail })
  error!: ErrorDetail;
}

/** Documents error responses: `@ApiErrors([409, 'VOUCHER_ALREADY_REDEEMED'], ...)`. */
export function ApiErrors(...errors: Array<[status: number, ...codes: ErrorCode[]]>) {
  return applyDecorators(
    ...errors.map(([status, ...codes]) =>
      ApiResponse({ status, type: ErrorResponseDto, description: `Error codes: ${codes.join(', ')}` }),
    ),
  );
}
