import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Do not retry business errors (4xx); retry network blips twice.
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
    },
  },
});

export const queryKeys = {
  member: ['member'] as const,
  card: ['card'] as const,
  plans: ['plans'] as const,
  categories: ['categories'] as const,
  partners: (category: string | null) => ['partners', category ?? 'all'] as const,
  partner: (id: string) => ['partner', id] as const,
  offer: (id: string) => ['offer', id] as const,
  vouchers: ['vouchers'] as const,
  voucher: (id: string) => ['voucher', id] as const,
};
