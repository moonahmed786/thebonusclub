import { useQuery } from '@tanstack/react-query';
import { config } from '../../config/env';
import { api, unwrap } from '../../shared/api/client';
import type { PartnerList } from '../../shared/api/types';
import { queryKeys } from '../../shared/queryClient';
import { filterPartnersByCategory } from './partner-filter';

const PAGE_SIZE = 100;

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => unwrap(await api.GET('/api/v1/categories')),
    staleTime: config.partnerListStaleMs,
  });
}

/**
 * Partner directory. The full list is cached briefly; a category filter is applied to that
 * cached list when it is complete, and sent to the server only when the list is paginated.
 */
export function usePartners(category: string | null) {
  const all = useQuery({
    queryKey: queryKeys.partners(null),
    queryFn: async () => unwrap(await api.GET('/api/v1/partners', { params: { query: { pageSize: PAGE_SIZE } } })),
    staleTime: config.partnerListStaleMs,
  });
  const complete = !!all.data && all.data.items.length >= all.data.total;

  const filtered = useQuery({
    queryKey: queryKeys.partners(category),
    enabled: !!category && !!all.data && !complete,
    queryFn: async () =>
      unwrap(await api.GET('/api/v1/partners', { params: { query: { category: category ?? undefined, pageSize: PAGE_SIZE } } })),
    staleTime: config.partnerListStaleMs,
  });

  const source: PartnerList | undefined = category && !complete ? filtered.data : all.data;
  const items = source ? (complete ? filterPartnersByCategory(source.items, category) : source.items) : undefined;
  const active = category && !complete ? filtered : all;

  return {
    items,
    isPending: all.isPending || (!!category && !complete && filtered.isPending),
    error: all.error ?? filtered.error,
    isRefetching: active.isRefetching,
    refetch: () => Promise.all([all.refetch(), category && !complete ? filtered.refetch() : null]),
  };
}

export function usePartner(id: string) {
  return useQuery({
    queryKey: queryKeys.partner(id),
    queryFn: async () => unwrap(await api.GET('/api/v1/partners/{id}', { params: { path: { id } } })),
  });
}

export function useOffer(id: string) {
  return useQuery({
    queryKey: queryKeys.offer(id),
    queryFn: async () => unwrap(await api.GET('/api/v1/offers/{id}', { params: { path: { id } } })),
  });
}
