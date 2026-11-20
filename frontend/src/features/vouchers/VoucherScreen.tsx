import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import type { VouchersStackParams } from '../../app/navigation-types';
import { Card } from '../../shared/components/Card';
import { Screen } from '../../shared/components/Screen';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { ErrorView, LoadingView } from '../../shared/components/StateViews';
import { useTheme } from '../../shared/theme/theme';
import { formatDate, formatDateTime } from '../../shared/utils/format';
import { VoucherCodeView } from './VoucherCodeView';
import { voucherBadge } from './voucher-status';
import { useVoucher } from './vouchers-api';

type Props = NativeStackScreenProps<VouchersStackParams, 'Voucher'>;

export function VoucherScreen({ route }: Props) {
  const theme = useTheme();
  const query = useVoucher(route.params.id);

  if (query.isPending) return <LoadingView />;
  if (query.isError) return <ErrorView error={query.error} onRetry={() => query.refetch()} />;
  const { voucher, code } = query.data;

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <StatusBadge {...voucherBadge(voucher.status)} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{voucher.offerTitle}</Text>
      <Text style={{ color: theme.colors.textMuted }}>{voucher.partnerName}</Text>
      <Card style={styles.card}>
        {code ? (
          <VoucherCodeView code={code} status={voucher.status} />
        ) : (
          <Text style={{ color: theme.colors.textMuted }}>
            Code ending ••••{voucher.codeLast4}. The full code was shown when you claimed it and is only stored on the phone you claimed it on.
          </Text>
        )}
      </Card>
      <Text style={{ color: theme.colors.textMuted }}>Claimed {formatDateTime(voucher.claimedAt)}</Text>
      {voucher.status === 'redeemed' ? (
        <Text style={{ color: theme.colors.textMuted }}>Redeemed {formatDateTime(voucher.redeemedAt)}</Text>
      ) : (
        <Text style={{ color: theme.colors.textMuted }}>
          {voucher.status === 'expired' ? 'Expired' : 'Expires'} {formatDate(voucher.expiresAt)}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  card: { marginTop: 16 },
});
