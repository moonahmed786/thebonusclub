import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { buildOpenApiDocument, configureApp } from '../src/app.setup';
import { RedisService } from '../src/shared/cache/redis.service';
import { MongoService } from '../src/shared/db/mongo.service';
import { PrismaService } from '../src/shared/db/prisma.service';
import { sha256 } from '../src/shared/crypto/codes';

const API = '/api/v1';
const PARTNER_KEY = 'bcp_test-partner-key-0001';
const OTHER_PARTNER_KEY = 'bcp_test-partner-key-0002';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin-password-123';

describe('The Bonus Club API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService['client'];
  let http: ReturnType<typeof request>;
  let offerId: string;
  let secondOfferId: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());
    prisma = app.get(PrismaService).client;

    if (!/_test(\?|$)/.test(process.env.DATABASE_URL ?? '')) throw new Error('Refusing to wipe a non-test database');
    await prisma.$executeRawUnsafe(
      'TRUNCATE devices, verification_codes, vouchers, offers, partners, categories, payments, subscriptions, users, plans CASCADE',
    );
    await app.get(RedisService).client.flushdb();
    await app.get(MongoService).db().collection('audit_events').deleteMany({});

    await prisma.plan.create({ data: { code: 'ANNUAL', name: 'Annual membership', priceCents: 9900, durationMonths: 12 } });
    const category = await prisma.category.create({ data: { slug: 'fuel', name: 'Fuel' } });
    await prisma.user.create({
      data: { email: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 4), role: 'ADMIN', status: 'ACTIVE' },
    });
    const partner = await prisma.partner.create({
      data: { name: 'Fuel Stop', categoryId: category.id, redemptionMethod: 'Show code at till', apiKeyHash: sha256(PARTNER_KEY) },
    });
    await prisma.partner.create({
      data: { name: 'Other Partner', categoryId: category.id, redemptionMethod: 'Show code', apiKeyHash: sha256(OTHER_PARTNER_KEY) },
    });
    const yesterday = new Date(Date.now() - 86_400_000);
    offerId = (await prisma.offer.create({ data: { partnerId: partner.id, title: '10% off fuel', startsAt: yesterday } })).id;
    secondOfferId = (await prisma.offer.create({ data: { partnerId: partner.id, title: 'Free coffee', startsAt: yesterday } })).id;

    const login = await http.post(`${API}/auth/login`).send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }).expect(200);
    adminToken = login.body.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerMember(email: string) {
    const res = await http.post(`${API}/auth/register`).send({ email, password: 'member-pass-1', firstName: 'Jane', planCode: 'ANNUAL' }).expect(201);
    return { id: res.body.member.id as string, token: res.body.tokens.accessToken as string, refresh: res.body.tokens.refreshToken as string, body: res.body };
  }

  async function activeMember(email: string) {
    const m = await registerMember(email);
    await http
      .post(`${API}/admin/members/${m.id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ paymentReference: `PAY-${email}`, amountCents: 9900 })
      .expect(201);
    return m;
  }

  describe('auth & onboarding', () => {
    it('registers an inactive member with a BC- member ID', async () => {
      const m = await registerMember('new@example.com');
      expect(m.body.member.membershipStatus).toBe('inactive');
      expect(m.body.member.memberId).toMatch(/^BC-\d+$/);
      expect(m.body.member).not.toHaveProperty('passwordHash');
    });

    it('rejects a duplicate email with 409 EMAIL_TAKEN', async () => {
      await registerMember('dupe@example.com');
      const res = await http.post(`${API}/auth/register`).send({ email: 'DUPE@example.com', password: 'member-pass-1' }).expect(409);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('returns the standard error shape on invalid input', async () => {
      const res = await http.post(`${API}/auth/register`).send({ email: 'not-an-email', password: 'x' }).expect(400);
      expect(res.body.error).toMatchObject({ code: 'VALIDATION_FAILED' });
      expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
    });

    it('rejects unknown fields (no social login or extra sign-up methods)', async () => {
      await http.post(`${API}/auth/register`).send({ email: 'x@example.com', password: 'member-pass-1', googleToken: 'abc' }).expect(400);
    });

    it('rejects a wrong password with 401 INVALID_CREDENTIALS', async () => {
      await registerMember('login@example.com');
      const res = await http.post(`${API}/auth/login`).send({ email: 'login@example.com', password: 'wrong-pass' }).expect(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rotates refresh tokens and rejects reuse', async () => {
      const m = await registerMember('refresh@example.com');
      const first = await http.post(`${API}/auth/refresh`).send({ refreshToken: m.refresh }).expect(200);
      await http.post(`${API}/auth/refresh`).send({ refreshToken: m.refresh }).expect(401);
      // Reuse revoked the whole session, so even the newest token is dead now.
      await http.post(`${API}/auth/refresh`).send({ refreshToken: first.body.refreshToken }).expect(401);
    });

    it('logout ends the session for the access token', async () => {
      const m = await registerMember('logout@example.com');
      await http.post(`${API}/auth/logout`).set('Authorization', `Bearer ${m.token}`).expect(204);
      await http.get(`${API}/members/me`).set('Authorization', `Bearer ${m.token}`).expect(401);
    });
  });

  describe('admin activation', () => {
    it('rejects member tokens on admin endpoints', async () => {
      const m = await registerMember('sneaky@example.com');
      await http
        .post(`${API}/admin/members/${m.id}/activate`)
        .set('Authorization', `Bearer ${m.token}`)
        .send({ paymentReference: 'PAY-SELF', amountCents: 9900 })
        .expect(403);
    });

    it('activates once, then is idempotent', async () => {
      const m = await registerMember('activate@example.com');
      const first = await http
        .post(`${API}/admin/members/${m.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentReference: 'PAY-A1', amountCents: 9900 })
        .expect(201);
      expect(first.body.member.membershipStatus).toBe('active');
      expect(first.body.alreadyActive).toBe(false);

      const second = await http
        .post(`${API}/admin/members/${m.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentReference: 'PAY-A2', amountCents: 9900 })
        .expect(200);
      expect(second.body.alreadyActive).toBe(true);
      expect(await prisma.subscription.count({ where: { userId: m.id } })).toBe(1);

      const audit = await app.get(MongoService).db().collection('audit_events').countDocuments({ action: 'member.activated', subjectId: m.id });
      expect(audit).toBe(1);
    });

    it('rejects a reused payment reference with 409', async () => {
      const m = await registerMember('payref@example.com');
      const res = await http
        .post(`${API}/admin/members/${m.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentReference: 'PAY-A1', amountCents: 9900 })
        .expect(409);
      expect(res.body.error.code).toBe('PAYMENT_REFERENCE_USED');
    });
  });

  describe('membership card & verification codes', () => {
    it('issues a single-use code that a partner can verify once', async () => {
      const m = await activeMember('card@example.com');
      const card = await http.get(`${API}/members/me/card`).set('Authorization', `Bearer ${m.token}`).expect(200);
      expect(card.body.membershipStatus).toBe('active');

      const issued = await http.post(`${API}/members/me/verification-codes`).set('Authorization', `Bearer ${m.token}`).expect(201);
      const ok = await http.post(`${API}/partner/verification-codes/verify`).set('x-partner-key', PARTNER_KEY).send({ code: issued.body.code }).expect(200);
      expect(ok.body).toEqual({ memberId: card.body.memberId, membershipStatus: 'active', expiresAt: expect.any(String) });

      const reused = await http.post(`${API}/partner/verification-codes/verify`).set('x-partner-key', PARTNER_KEY).send({ code: issued.body.code }).expect(404);
      expect(reused.body.error.code).toBe('VERIFICATION_CODE_INVALID');
    });

    it('rejects verification without a valid partner key', async () => {
      await http.post(`${API}/partner/verification-codes/verify`).set('x-partner-key', 'bcp_wrong').send({ code: 'ABCDEFGH' }).expect(401);
    });
  });

  describe('vouchers', () => {
    it('blocks inactive members from claiming', async () => {
      const m = await registerMember('inactive-claim@example.com');
      const res = await http.post(`${API}/vouchers`).set('Authorization', `Bearer ${m.token}`).send({ offerId }).expect(403);
      expect(res.body.error.code).toBe('MEMBERSHIP_INACTIVE');
    });

    it('claims once per offer and stores only a hash of the code', async () => {
      const m = await activeMember('claim@example.com');
      const res = await http.post(`${API}/vouchers`).set('Authorization', `Bearer ${m.token}`).send({ offerId }).expect(201);
      expect(res.body.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(res.body.status).toBe('claimed');

      const row = await prisma.voucher.findUniqueOrThrow({ where: { id: res.body.id } });
      expect(row.codeHash).not.toContain(res.body.code.replace(/-/g, ''));

      const again = await http.post(`${API}/vouchers`).set('Authorization', `Bearer ${m.token}`).send({ offerId }).expect(422);
      expect(again.body.error.code).toBe('VOUCHER_CLAIM_LIMIT_REACHED');

      const detail = await http.get(`${API}/vouchers/${res.body.id}`).set('Authorization', `Bearer ${m.token}`).expect(200);
      expect(detail.body).not.toHaveProperty('code');
    });

    it('allows only one of two parallel claims when the limit is 1', async () => {
      const m = await activeMember('parallel-claim@example.com');
      const results = await Promise.all([
        http.post(`${API}/vouchers`).set('Authorization', `Bearer ${m.token}`).send({ offerId: secondOfferId }),
        http.post(`${API}/vouchers`).set('Authorization', `Bearer ${m.token}`).send({ offerId: secondOfferId }),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 422]);
    });

    it("hides another member's voucher", async () => {
      const owner = await activeMember('owner@example.com');
      const other = await activeMember('other@example.com');
      const claimed = await http.post(`${API}/vouchers`).set('Authorization', `Bearer ${owner.token}`).send({ offerId }).expect(201);
      await http.get(`${API}/vouchers/${claimed.body.id}`).set('Authorization', `Bearer ${other.token}`).expect(404);
    });

    it('redeems atomically: of two parallel redemptions exactly one succeeds', async () => {
      const m = await activeMember('redeem@example.com');
      const claimed = await http.post(`${API}/vouchers`).set('Authorization', `Bearer ${m.token}`).send({ offerId }).expect(201);

      const results = await Promise.all([
        http.post(`${API}/partner/vouchers/redeem`).set('x-partner-key', PARTNER_KEY).send({ code: claimed.body.code }),
        http.post(`${API}/partner/vouchers/redeem`).set('x-partner-key', PARTNER_KEY).send({ code: claimed.body.code }),
      ]);
      const statuses = results.map((r) => r.status).sort();
      expect(statuses).toEqual([200, 409]);
      expect(results.find((r) => r.status === 409)?.body.error.code).toBe('VOUCHER_ALREADY_REDEEMED');

      const row = await prisma.voucher.findUniqueOrThrow({ where: { id: claimed.body.id } });
      expect(row.status).toBe('REDEEMED');
      const events = await app.get(MongoService).db().collection('audit_events').countDocuments({ action: 'voucher.redeemed', subjectId: claimed.body.id });
      expect(events).toBe(1);
    });

    it("does not let a partner redeem another partner's voucher", async () => {
      const m = await activeMember('wrong-partner@example.com');
      const claimed = await http.post(`${API}/vouchers`).set('Authorization', `Bearer ${m.token}`).send({ offerId }).expect(201);
      const res = await http.post(`${API}/partner/vouchers/redeem`).set('x-partner-key', OTHER_PARTNER_KEY).send({ code: claimed.body.code }).expect(404);
      expect(res.body.error.code).toBe('VOUCHER_NOT_FOUND');
    });

    it('expires due vouchers via cron, safely when run twice', async () => {
      const m = await activeMember('expire@example.com');
      const claimed = await http.post(`${API}/vouchers`).set('Authorization', `Bearer ${m.token}`).send({ offerId }).expect(201);
      await prisma.voucher.update({ where: { id: claimed.body.id }, data: { expiresAt: new Date(Date.now() - 1000) } });

      await http.get(`${API}/cron/expire-vouchers`).expect(401);
      const first = await http.get(`${API}/cron/expire-vouchers`).set('Authorization', 'Bearer test-cron-secret').expect(200);
      expect(first.body.expired).toBeGreaterThanOrEqual(1);
      const second = await http.get(`${API}/cron/expire-vouchers`).set('Authorization', 'Bearer test-cron-secret').expect(200);
      expect(second.body.expired).toBe(0);

      const redeem = await http.post(`${API}/partner/vouchers/redeem`).set('x-partner-key', PARTNER_KEY).send({ code: claimed.body.code }).expect(409);
      expect(redeem.body.error.code).toBe('VOUCHER_EXPIRED');
    });
  });

  describe('partners', () => {
    it('lists partners by category and shows a profile with live offers', async () => {
      const m = await registerMember('browse@example.com');
      const list = await http.get(`${API}/partners?category=fuel`).set('Authorization', `Bearer ${m.token}`).expect(200);
      expect(list.body.total).toBe(2);
      const fuelStop = list.body.items.find((p: { name: string }) => p.name === 'Fuel Stop');
      const detail = await http.get(`${API}/partners/${fuelStop.id}`).set('Authorization', `Bearer ${m.token}`).expect(200);
      expect(detail.body.offers).toHaveLength(2);
      expect(JSON.stringify(detail.body)).not.toContain('apiKey');
      await http.get(`${API}/partners?category=unknown`).set('Authorization', `Bearer ${m.token}`).expect(404);
    });
  });

  describe('swagger contract', () => {
    it('documents every public route, with error responses', () => {
      const doc = buildOpenApiDocument(app);
      const expected = [
        'post /api/v1/auth/register',
        'post /api/v1/auth/login',
        'post /api/v1/auth/refresh',
        'post /api/v1/auth/logout',
        'get /api/v1/plans',
        'get /api/v1/members/me',
        'patch /api/v1/members/me',
        'put /api/v1/members/me/plan',
        'get /api/v1/members/me/card',
        'post /api/v1/members/me/verification-codes',
        'post /api/v1/partner/verification-codes/verify',
        'get /api/v1/categories',
        'get /api/v1/partners',
        'get /api/v1/partners/{id}',
        'get /api/v1/offers/{id}',
        'post /api/v1/vouchers',
        'get /api/v1/vouchers',
        'get /api/v1/vouchers/{id}',
        'post /api/v1/partner/vouchers/redeem',
        'post /api/v1/devices',
        'post /api/v1/devices/unregister',
        'get /api/v1/admin/members',
        'post /api/v1/admin/members/{id}/activate',
        'post /api/v1/admin/partners',
        'post /api/v1/admin/partners/{id}/api-key',
        'post /api/v1/admin/offers',
        'patch /api/v1/admin/offers/{id}',
      ];
      const documented = Object.entries(doc.paths).flatMap(([path, ops]) =>
        Object.keys(ops as object).map((method) => `${method} ${path}`),
      );
      expect(documented.sort()).toEqual(expected.sort());
      for (const [, ops] of Object.entries(doc.paths)) {
        for (const op of Object.values(ops as Record<string, { responses: Record<string, unknown> }>)) {
          const codes = Object.keys(op.responses);
          expect(codes.some((c) => c.startsWith('2'))).toBe(true);
          if (op !== (doc.paths['/api/v1/plans'] as Record<string, unknown>)?.get) {
            expect(codes.some((c) => c.startsWith('4'))).toBe(true);
          }
        }
      }
    });
  });
});
