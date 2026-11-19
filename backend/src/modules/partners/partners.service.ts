import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/cache/redis.service';
import { PrismaService } from '../../shared/db/prisma.service';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCode } from '../../shared/errors/error-codes';
import { AppLogger } from '../../shared/logger/app-logger';
import { liveOfferWhere } from '../offers/offer-rules';
import { CategoryDto, PartnerDetailDto, PartnerListDto } from './dto/partner.dto';

const CACHE_TTL_SECONDS = 300;
const CACHE_VERSION_KEY = 'partners:cache-version';

@Injectable()
export class PartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: AppLogger,
  ) {}

  async listCategories(): Promise<CategoryDto[]> {
    return this.cached('categories', async () => {
      const categories = await this.prisma.client.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
      return categories.map(CategoryDto.from);
    });
  }

  async listPartners(category: string | undefined, page: number, pageSize: number): Promise<PartnerListDto> {
    return this.cached(`list:${category ?? '*'}:${page}:${pageSize}`, async () => {
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
    });
  }

  async getPartner(id: string): Promise<PartnerDetailDto> {
    const partner = await this.prisma.client.partner.findFirst({
      where: { id, isActive: true },
      include: { category: true, offers: { where: liveOfferWhere(), orderBy: { startsAt: 'desc' } } },
    });
    if (!partner) throw AppError.notFound(ErrorCode.PARTNER_NOT_FOUND, 'Partner not found');
    return PartnerDetailDto.from(partner);
  }

  /** Call after any admin change to partners, categories, or offers. */
  async invalidateCache(): Promise<void> {
    try {
      await this.redis.client.incr(CACHE_VERSION_KEY);
    } catch (err) {
      this.logger.warn('partner cache invalidation failed', { err: err instanceof Error ? err.message : String(err) });
    }
  }

  /** Read-through cache. Redis is optional here: on any Redis error, read from Postgres. */
  private async cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    let fullKey: string | undefined;
    try {
      const version = (await this.redis.client.get(CACHE_VERSION_KEY)) ?? '0';
      fullKey = `partners:v${version}:${key}`;
      const hit = await this.redis.client.get(fullKey);
      if (hit) return JSON.parse(hit) as T;
    } catch {
      fullKey = undefined;
    }
    const value = await load();
    if (fullKey) {
      this.redis.client.set(fullKey, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS).catch(() => undefined);
    }
    return value;
  }
}
