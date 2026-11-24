import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../shared/api/client';
import type { ClaimedVoucher } from '../../shared/api/types';
import { queryKeys } from '../../shared/queryClient';
import { getVoucherCode, saveVoucherCode } from './voucher-codes';

export function useClaimVoucher() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (offerId: string): Promise<ClaimedVoucher> => {
      const voucher = unwrap(await api.POST('/api/v1/vouchers', { body: { offerId } }));
      await saveVoucherCode(voucher.id, voucher.code);
      return voucher;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.vouchers }),
  });
}

export function useVouchers() {
  return useQuery({
    queryKey: queryKeys.vouchers,
    queryFn: async () => unwrap(await api.GET('/api/v1/vouchers', { params: { query: { pageSize: 100 } } })),
  });
}

export function useVoucher(id: string) {
  return useQuery({
    queryKey: queryKeys.voucher(id),
    queryFn: async () => {
      const voucher = unwrap(await api.GET('/api/v1/vouchers/{id}', { params: { path: { id } } }));
      const code = await getVoucherCode(id);
      return { voucher, code };
    },
  });
}
