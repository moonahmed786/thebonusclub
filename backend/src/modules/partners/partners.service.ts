import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/db/prisma.service';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCode } from '../../shared/errors/error-codes';
import { liveOfferWhere } from '../offers/offer-rules';
import { CategoryDto, PartnerDetailDto, PartnerListDto } from './dto/partner.dto';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(): Promise<CategoryDto[]> {
    const categories = await this.prisma.client.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    return categories.map(CategoryDto.from);
  }

  async listPartners(category: string | undefined, page: number, pageSize: number): Promise<PartnerListDto> {
    if (category) {
      const exists = await this.prisma.client.category.findUnique({ where: { slug: category } });
      if (!exists) throw AppError.notFound(ErrorCode.CATEGORY_NOT_FOUND, 'Category not found');
    }
    const where = { isActive: true, ...(category ? { category: { slug: category } } : {}) };
    const [total, partners] = await this.prisma.client.$transaction([
      this.prisma.client.partner.count({ where }),
      this.prisma.client.partner.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true, _count: { select: { offers: { where: liveOfferWhere() } } } },
      }),
    ]);
    return {
      items: partners.map((p) => ({
        id: p.id,
        name: p.name,
        category: CategoryDto.from(p.category),
        logoUrl: p.logoUrl,
        liveOfferCount: p._count.offers,
      })),
      page,
      pageSize,
      total,
    };
  }

  async getPartner(id: string): Promise<PartnerDetailDto> {
    const partner = await this.prisma.client.partner.findFirst({
      where: { id, isActive: true },
      include: { category: true, offers: { where: liveOfferWhere(), orderBy: { startsAt: 'desc' } } },
    });
    if (!partner) throw AppError.notFound(ErrorCode.PARTNER_NOT_FOUND, 'Partner not found');
    return PartnerDetailDto.from(partner);
  }
}
