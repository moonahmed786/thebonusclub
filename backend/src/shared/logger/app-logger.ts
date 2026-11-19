import { Injectable, LoggerService } from '@nestjs/common';

type Level = 'debug' | 'info' | 'warn' | 'error';

// Keys that must never reach the logs, even by accident.
const REDACTED_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'fcmToken',
  'code',
  'apiKey',
  'authorization',
  'email',
]);

function redact(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = REDACTED_KEYS.has(key) ? '[redacted]' : value;
  }
  return out;
}

/** Structured JSON logger. Use instead of console.log. */
@Injectable()
export class AppLogger implements LoggerService {
  private write(level: Level, message: string, fields: Record<string, unknown> = {}): void {
    if (process.env.NODE_ENV === 'test' && level !== 'error') return;
    const line = JSON.stringify({ level, time: new Date().toISOString(), msg: message, ...redact(fields) });
    if (level === 'error' || level === 'warn') {
      process.stderr.write(`${line}\n`);
    } else {
      process.stdout.write(`${line}\n`);
    }
  }

  info(message: string, fields?: Record<string, unknown>): void {
    this.write('info', message, fields);
  }

  // LoggerService interface (used by Nest internals)
  log(message: unknown, context?: string): void {
    this.write('info', String(message), context ? { context } : {});
  }

  warn(message: unknown, fields?: Record<string, unknown> | string): void {
    this.write('warn', String(message), typeof fields === 'string' ? { context: fields } : fields);
  }

  error(message: unknown, fields?: Record<string, unknown> | string): void {
    this.write('error', String(message), typeof fields === 'string' ? { context: fields } : fields);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', String(message), context ? { context } : {});
  }

  verbose(message: unknown, context?: string): void {
    this.debug(message, context);
  }
}
