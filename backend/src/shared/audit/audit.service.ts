import { Injectable } from '@nestjs/common';
import { MongoService } from '../db/mongo.service';
import { AppLogger } from '../logger/app-logger';

export type AuditAction =
  | 'member.registered'
  | 'member.plan_selected'
  | 'member.activated'
  | 'voucher.claimed'
  | 'voucher.redeemed'
  | 'voucher.expired'
  | 'verification_code.used'
  | 'admin.partner_created'
  | 'admin.partner_api_key_rotated'
  | 'admin.offer_created'
  | 'admin.offer_updated';

export interface AuditEvent {
  action: AuditAction;
  actorType: 'member' | 'admin' | 'partner' | 'system';
  actorId: string | null;
  subjectType: 'user' | 'voucher' | 'partner' | 'offer' | 'verification_code';
  subjectId: string;
  requestId?: string;
  /** Small, flat metadata only. Never personal data, tokens, or full codes. */
  data?: Record<string, string | number | boolean | null>;
}

export const AUDIT_COLLECTION = 'audit_events';

/**
 * Append-only audit trail in MongoDB. Called after the Postgres commit; Postgres stays the
 * source of truth, so a Mongo failure is logged but never rolls back or fails the request.
 */
@Injectable()
export class AuditService {
  constructor(
    private readonly mongo: MongoService,
    private readonly logger: AppLogger,
  ) {}

  async record(event: AuditEvent): Promise<void> {
    await this.recordMany([event]);
  }

  async recordMany(events: AuditEvent[]): Promise<void> {
    if (events.length === 0) return;
    const at = new Date();
    try {
      await this.mongo
        .db()
        .collection(AUDIT_COLLECTION)
        .insertMany(events.map((e) => ({ ...e, data: e.data ?? {}, at })));
    } catch (err) {
      this.logger.error('Audit write failed', {
        actions: events.map((e) => e.action).join(','),
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
