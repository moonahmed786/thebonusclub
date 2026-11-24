import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../shared/api/client';
import type { MembershipCard, UpdateProfileInput } from '../../shared/api/types';
import { queryKeys } from '../../shared/queryClient';
import { readSecure, SecureKeys, writeSecure } from '../../shared/storage/secure-store';

export function useMember() {
  return useQuery({
    queryKey: queryKeys.member,
    queryFn: async () => unwrap(await api.GET('/api/v1/members/me')),
  });
}

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans,
    queryFn: async () => unwrap(await api.GET('/api/v1/plans')),
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => unwrap(await api.PATCH('/api/v1/members/me', { body: input })),
    onSuccess: (member) => client.setQueryData(queryKeys.member, member),
  });
}

export function useSelectPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (planCode: string) => unwrap(await api.PUT('/api/v1/members/me/plan', { body: { planCode } })),
    onSuccess: (member) => client.setQueryData(queryKeys.member, member),
  });
}

export interface CachedCard {
  card: MembershipCard;
  /** When the card was last fetched from the server (UTC ISO). */
  savedAt: string;
  fromCache: boolean;
}

/**
 * The card works offline: every successful fetch is saved to the secure store, and when the
 * server cannot be reached the last saved card is shown with its "last updated" time.
 */
export function useMembershipCard() {
  return useQuery<CachedCard>({
    queryKey: queryKeys.card,
    queryFn: async () => {
      try {
        const card = unwrap(await api.GET('/api/v1/members/me/card'));
        const saved = { card, savedAt: new Date().toISOString() };
        await writeSecure(SecureKeys.card, saved);
        return { ...saved, fromCache: false };
      } catch (err) {
        const cached = await readSecure<{ card: MembershipCard; savedAt: string }>(SecureKeys.card);
        if (cached) return { ...cached, fromCache: true };
        throw err;
      }
    },
  });
}

export function useIssueVerificationCode() {
  return useMutation({
    mutationFn: async () => unwrap(await api.POST('/api/v1/members/me/verification-codes')),
  });
}
