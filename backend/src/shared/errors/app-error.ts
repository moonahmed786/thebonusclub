import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';

export class AppError extends Error {
  constructor(
    readonly status: HttpStatus,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(code: ErrorCode, message: string): AppError {
    return new AppError(HttpStatus.NOT_FOUND, code, message);
  }

  static conflict(code: ErrorCode, message: string): AppError {
    return new AppError(HttpStatus.CONFLICT, code, message);
  }

  static unprocessable(code: ErrorCode, message: string): AppError {
    return new AppError(HttpStatus.UNPROCESSABLE_ENTITY, code, message);
  }

  static unauthenticated(code: ErrorCode = ErrorCode.UNAUTHENTICATED, message = 'Authentication required'): AppError {
    return new AppError(HttpStatus.UNAUTHORIZED, code, message);
  }

  static forbidden(code: ErrorCode = ErrorCode.FORBIDDEN, message = 'Not allowed'): AppError {
    return new AppError(HttpStatus.FORBIDDEN, code, message);
  }
}
