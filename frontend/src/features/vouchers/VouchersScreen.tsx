import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { VouchersStackParams } from '../../app/navigation-types';
import { Card } from '../../shared/components/Card';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { EmptyView, ErrorView, LoadingView } from '../../shared/components/StateViews';
import { useTheme } from '../../shared/theme/theme';
import { formatDate } from '../../shared/utils/format';
import { voucherBadge } from './voucher-status';
import { useVouchers } from './vouchers-api';

type Props = NativeStackScreenProps<VouchersStackParams, 'Vouchers'>;

export function VouchersScreen({ navigation }: Props) {
  const theme = useTheme();
  const vouchers = useVouchers();

  if (vouchers.isPending) return <LoadingView label="Loading vouchers…" />;
  if (vouchers.isError) return <ErrorView error={vouchers.error} onRetry={() => vouchers.refetch()} />;

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <FlatList
        contentContainerStyle={styles.list}
        data={vouchers.data.items}
        keyExtractor={(v) => v.id}
        refreshControl={<RefreshControl refreshing={vouchers.isRefetching} onRefresh={() => {
          vouchers.refetch();
        }} tintColor={theme.colors.primary} />}
        ListEmptyComponent={<EmptyView title="No vouchers yet" message="Claim a voucher from a partner offer and it will appear here." />}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Voucher', { id: item.id })}>
            <Card>
              <StatusBadge {...voucherBadge(item.status)} />
              <Text style={[styles.title, { color: theme.colors.text }]}>{item.offerTitle}</Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {item.partnerName} · ••••{item.codeLast4} ·{' '}
                {item.status === 'redeemed' ? `Used ${formatDate(item.redeemedAt)}` : `${item.status === 'expired' ? 'Expired' : 'Expires'} ${formatDate(item.expiresAt)}`}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { padding: 16, flexGrow: 1 },
  title: { fontSize: 16, fontWeight: '700', marginTop: 8 },
});
