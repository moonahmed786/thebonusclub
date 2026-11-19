import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppLogger } from '../logger/app-logger';
import { AppError } from './app-error';
import { ErrorCode } from './error-codes';

interface ErrorBody {
  error: { code: string; message: string; requestId: string; details?: unknown };
}

const STATUS_TO_CODE: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_FAILED,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMITED,
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const requestId = req.requestId ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL_ERROR;
    let message = 'Something went wrong';
    let details: unknown;

    if (exception instanceof AppError) {
      status = exception.status;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = STATUS_TO_CODE[status] ?? ErrorCode.INTERNAL_ERROR;
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const raw = (response as { message: unknown }).message;
        if (Array.isArray(raw)) {
          message = 'Request validation failed';
          details = raw;
        } else if (typeof raw === 'string') {
          message = raw;
        }
      } else if (typeof response === 'string') {
        message = response;
      }
    }

    if (status >= 500) {
      this.logger.error('Unhandled error', {
        requestId,
        route: req.originalUrl,
        err: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      });
      if (!(exception instanceof AppError)) {
        message = 'Something went wrong';
      }
    }

    const body: ErrorBody = { error: { code, message, requestId } };
    if (details !== undefined) body.error.details = details;
    res.status(status).json(body);
  }
}
