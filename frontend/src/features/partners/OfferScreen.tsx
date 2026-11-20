import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import type { PartnersStackParams } from '../../app/navigation-types';
import { Card } from '../../shared/components/Card';
import { Screen } from '../../shared/components/Screen';
import { ErrorView, InlineError, LoadingView } from '../../shared/components/StateViews';
import { useTheme } from '../../shared/theme/theme';
import { formatDate } from '../../shared/utils/format';
import { useMember } from '../membership/membership-api';
import { ClaimButton } from '../vouchers/ClaimButton';
import { VoucherCodeView } from '../vouchers/VoucherCodeView';
import { useClaimVoucher } from '../vouchers/vouchers-api';
import { useOffer } from './partners-api';

type Props = NativeStackScreenProps<PartnersStackParams, 'Offer'>;

export function OfferScreen({ route }: Props) {
  const theme = useTheme();
  const offer = useOffer(route.params.id);
  const member = useMember();
  const claim = useClaimVoucher();

  if (offer.isPending) return <LoadingView />;
  if (offer.isError) return <ErrorView error={offer.error} onRetry={() => offer.refetch()} />;
  const o = offer.data;
  const active = member.data?.membershipStatus === 'active';

  return (
    <Screen>
      <Text style={{ color: theme.colors.textMuted }}>{route.params.partnerName}</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>{o.title}</Text>
      {o.description ? <Text style={[styles.body, { color: theme.colors.text }]}>{o.description}</Text> : null}
      <Card>
        <Text style={[styles.section, { color: theme.colors.text }]}>How to redeem</Text>
        <Text style={{ color: theme.colors.text }}>{route.params.redemptionMethod}</Text>
      </Card>
      {o.terms ? (
        <Card>
          <Text style={[styles.section, { color: theme.colors.text }]}>Terms</Text>
          <Text style={{ color: theme.colors.text }}>{o.terms}</Text>
        </Card>
      ) : null}
      {o.endsAt ? <Text style={[styles.meta, { color: theme.colors.textMuted }]}>Offer ends {formatDate(o.endsAt)}</Text> : null}

      {claim.data ? (
        <Card>
          <Text style={[styles.section, { color: theme.colors.text }]}>Your voucher code</Text>
          <VoucherCodeView code={claim.data.code} status={claim.data.status} />
          <Text style={{ color: theme.colors.textMuted }}>Valid until {formatDate(claim.data.expiresAt)}. You can find it later under Vouchers.</Text>
        </Card>
      ) : (
        <>
          <InlineError error={claim.error} />
          <ClaimButton onClaim={() => claim.mutate(o.id)} claiming={claim.isPending} membershipActive={active} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', marginVertical: 6 },
  body: { fontSize: 15, marginBottom: 16 },
  section: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  meta: { fontSize: 14, marginBottom: 16 },
});
