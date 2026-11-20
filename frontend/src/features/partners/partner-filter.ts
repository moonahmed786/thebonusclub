import type { PartnerSummary } from '../../shared/api/types';

/** Filters an already-loaded partner list by category slug (null = all). */
export function filterPartnersByCategory(partners: PartnerSummary[], category: string | null): PartnerSummary[] {
  if (!category) return partners;
  return partners.filter((p) => p.category.slug === category);
}
