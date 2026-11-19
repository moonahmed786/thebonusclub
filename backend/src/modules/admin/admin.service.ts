import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AuditService } from '../../shared/audit/audit.service';
import { randomToken, sha256 } from '../../shared/crypto/codes';
import { PrismaService } from '../../shared/db/prisma.service';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCode } from '../../shared/errors/error-codes';
import { MemberDto } from '../members/dto/member.dto';
import { OfferDto } from '../offers/dto/offer.dto';
import { PartnersService } from '../partners/partners.service';
import { AdminMemberListDto, CreateOfferDto, CreatePartnerDto, PartnerCreatedDto, UpdateOfferDto } from './dto/admin.dto';

function newPartnerApiKey(): { key: string; hash: string; prefix: string } {
  const key = `bcp_${randomToken(24)}`;
  return { key, hash: sha256(key), prefix: key.slice(0, 8) };
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly partners: PartnersService,
  ) {}

  async listMembers(status: 'INACTIVE' | 'ACTIVE' | undefined, search: string | undefined, page: number, pageSize: number): Promise<AdminMemberListDto> {
    const where: Prisma.UserWhereInput = { role: 'MEMBER' };
    if (status) where.status = status;
    if (search) where.OR = [{ memberId: search.toUpperCase() }, { email: search.toLowerCase() }];
    const [total, users] = await this.prisma.client.$transaction([
      this.prisma.client.user.count({ where }),
      this.prisma.client.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { plan: true },
      }),
    ]);
    return { items: users.map(MemberDto.from), page, pageSize, total };
  }

  async createPartner(adminId: string, dto: CreatePartnerDto, requestId?: string): Promise<PartnerCreatedDto> {
    const category = await this.prisma.client.category.findUnique({ where: { slug: dto.categorySlug } });
    if (!category) throw AppError.unprocessable(ErrorCode.CATEGORY_NOT_FOUND, 'Unknown category');
    const apiKey = newPartnerApiKey();
    const partner = await this.prisma.client.partner.create({
      data: {
        name: dto.name,
        categoryId: category.id,
        redemptionMethod: dto.redemptionMethod,
        description: dto.description,
        logoUrl: dto.logoUrl,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        apiKeyHash: apiKey.hash,
        apiKeyPrefix: apiKey.prefix,
      },
    });
    await this.audit.record({ action: 'admin.partner_created', actorType: 'admin', actorId: adminId, subjectType: 'partner', subjectId: partner.id, requestId });
    await this.partners.invalidateCache();
    return { id: partner.id, name: partner.name, apiKey: apiKey.key };
  }

  async rotatePartnerApiKey(adminId: string, partnerId: string, requestId?: string): Promise<PartnerCreatedDto> {
    const apiKey = newPartnerApiKey();
    const updated = await this.prisma.client.partner.updateMany({
      where: { id: partnerId },
      data: { apiKeyHash: apiKey.hash, apiKeyPrefix: apiKey.prefix },
    });
    if (updated.count === 0) throw AppError.notFound(ErrorCode.PARTNER_NOT_FOUND, 'Partner not found');
    const partner = await this.prisma.client.partner.findUniqueOrThrow({ where: { id: partnerId } });
    await this.audit.record({ action: 'admin.partner_api_key_rotated', actorType: 'admin', actorId: adminId, subjectType: 'partner', subjectId: partnerId, requestId });
    return { id: partner.id, name: partner.name, apiKey: apiKey.key };
  }

  async createOffer(adminId: string, dto: CreateOfferDto, requestId?: string): Promise<OfferDto> {
    const partner = await this.prisma.client.partner.findUnique({ where: { id: dto.partnerId } });
    if (!partner) throw AppError.notFound(ErrorCode.PARTNER_NOT_FOUND, 'Partner not found');
    const startsAt = new Date(dto.startsAt);
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (endsAt && endsAt <= startsAt) {
      throw AppError.unprocessable(ErrorCode.VALIDATION_FAILED, 'endsAt must be after startsAt');
    }
    const offer = await this.prisma.client.offer.create({
      data: {
        partnerId: dto.partnerId,
        title: dto.title,
        description: dto.description,
        terms: dto.terms,
        startsAt,
        endsAt,
        voucherValidityDays: dto.voucherValidityDays,
      },
    });
    await this.audit.record({ action: 'admin.offer_created', actorType: 'admin', actorId: adminId, subjectType: 'offer', subjectId: offer.id, requestId });
    await this.partners.invalidateCache();
    return OfferDto.from(offer);
  }

  async updateOffer(adminId: string, offerId: string, dto: UpdateOfferDto, requestId?: string): Promise<OfferDto> {
    const existing = await this.prisma.client.offer.findUnique({ where: { id: offerId } });
    if (!existing) throw AppError.notFound(ErrorCode.OFFER_NOT_FOUND, 'Offer not found');
    const offer = await this.prisma.client.offer.update({
      where: { id: offerId },
      data: {
        isPaused: dto.isPaused,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
    });
    await this.audit.record({
      action: 'admin.offer_updated',
      actorType: 'admin',
      actorId: adminId,
      subjectType: 'offer',
      subjectId: offer.id,
      requestId,
      data: { isPaused: offer.isPaused, endsAt: offer.endsAt?.toISOString() ?? null },
    });
    await this.partners.invalidateCache();
    return OfferDto.from(offer);
  }
}
