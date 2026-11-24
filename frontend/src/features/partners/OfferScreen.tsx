import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PartnersStackParams } from '../../app/navigation-types';
import { Card } from '../../shared/components/Card';
import { Screen } from '../../shared/components/Screen';
import { InfoRow, SectionTitle } from '../../shared/components/Section';
import { ErrorView, InlineError, LoadingView } from '../../shared/components/StateViews';
import { useTheme, withAlpha } from '../../shared/theme/theme';
import { formatDate } from '../../shared/utils/format';
import { useMember } from '../membership/membership-api';
import { ClaimButton } from '../vouchers/ClaimButton';
import { VoucherCodeView } from '../vouchers/VoucherCodeView';
import { VoucherTicket } from '../vouchers/VoucherTicket';
import { useClaimVoucher } from '../vouchers/vouchers-api';
import { useOffer } from './partners-api';

type Props = NativeStackScreenProps<PartnersStackParams, 'Offer'>;

export function OfferScreen({ route }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const offer = useOffer(route.params.id);
  const member = useMember();
  const claim = useClaimVoucher();

  if (offer.isPending) return <LoadingView />;
  if (offer.isError) return <ErrorView error={offer.error} onRetry={() => offer.refetch()} />;
  const o = offer.data;
  const active = member.data?.membershipStatus === 'active';

  const footer = claim.data ? undefined : (
    <>
      <InlineError error={claim.error} />
      <ClaimButton onClaim={() => claim.mutate(o.id)} claiming={claim.isPending} membershipActive={active} />
    </>
  );

  return (
    <Screen footer={footer}>
      {claim.data ? (
        <>
          <View style={[styles.success, { backgroundColor: withAlpha(colors.success, 0.12), borderColor: withAlpha(colors.success, 0.4), borderRadius: theme.radius }]}>
            <Text style={[styles.successText, { color: colors.success }]}>✓ Voucher claimed</Text>
          </View>
          <VoucherTicket
            partnerName={route.params.partnerName}
            offerTitle={o.title}
            status={claim.data.status}
            footer={`Valid until ${formatDate(claim.data.expiresAt)} · Saved under Vouchers`}>
            <VoucherCodeView code={claim.data.code} status={claim.data.status} />
          </VoucherTicket>
        </>
      ) : (
        <View style={styles.hero}>
          <Text style={[theme.type.overline, { color: colors.primary }]}>{route.params.partnerName}</Text>
          <Text accessibilityRole="header" style={[theme.type.display, styles.title, { color: colors.text }]}>
            {o.title}
          </Text>
          {o.description ? <Text style={[theme.type.body, { color: colors.textMuted }]}>{o.description}</Text> : null}
        </View>
      )}

      <SectionTitle title="Details" />
      <Card>
        <InfoRow glyph="◈" label="How to redeem" value={route.params.redemptionMethod} />
        {o.endsAt ? <InfoRow glyph="◷" label="Offer ends" value={formatDate(o.endsAt)} /> : null}
      </Card>

      {o.terms ? (
        <>
          <SectionTitle title="Terms" />
          <Card>
            <Text style={[theme.type.body, { color: colors.textMuted }]}>{o.terms}</Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: 12, marginTop: 4 },
  title: { marginTop: 8, marginBottom: 10 },
  success: { borderWidth: 1, padding: 12, marginBottom: 16, alignItems: 'center' },
  successText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});
