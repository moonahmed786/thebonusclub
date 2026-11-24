import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { VouchersStackParams } from '../../app/navigation-types';
import { LargeHeader } from '../../shared/components/Screen';
import { SectionTitle } from '../../shared/components/Section';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { EmptyView, ErrorView, LoadingView } from '../../shared/components/StateViews';
import { useTheme } from '../../shared/theme/theme';
import { formatDate } from '../../shared/utils/format';
import { groupVouchers, isCodeUsable, voucherBadge } from './voucher-status';
import { useVouchers } from './vouchers-api';

type Props = NativeStackScreenProps<VouchersStackParams, 'Vouchers'>;

export function VouchersScreen({ navigation }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const vouchers = useVouchers();

  if (vouchers.isPending) return <LoadingView label="Loading vouchers…" />;
  if (vouchers.isError) return <ErrorView error={vouchers.error} onRetry={() => vouchers.refetch()} />;

  const items = vouchers.data.items;
  const readyCount = items.filter((v) => isCodeUsable(v.status)).length;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <SectionList
        contentContainerStyle={styles.list}
        sections={groupVouchers(items)}
        keyExtractor={(v) => v.id}
        stickySectionHeadersEnabled={false}
        indicatorStyle="white"
        refreshControl={<RefreshControl refreshing={vouchers.isRefetching} onRefresh={() => { vouchers.refetch(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <LargeHeader
            overline="Your wallet"
            title="Vouchers"
            subtitle={items.length ? `${readyCount} ready to use` : undefined}
          />
        }
        ListEmptyComponent={<EmptyView glyph="✦" title="No vouchers yet" message="Claim a voucher from a partner offer and it will appear here." />}
        renderSectionHeader={({ section }) => <SectionTitle title={section.title} note={String(section.data.length)} />}
        renderItem={({ item }) => {
          const live = isCodeUsable(item.status);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.offerTitle} at ${item.partnerName}, ${voucherBadge(item.status).label}`}
              onPress={() => navigation.navigate('Voucher', { id: item.id })}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
                  borderColor: colors.border,
                  borderRadius: theme.radius,
                  opacity: live ? 1 : 0.72,
                },
              ]}>
              <View style={[styles.stripe, { backgroundColor: live ? colors.primary : colors.borderStrong }]} />
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={[theme.type.overline, styles.partner, { color: live ? colors.primary : colors.textFaint }]} numberOfLines={1}>
                    {item.partnerName}
                  </Text>
                  <StatusBadge {...voucherBadge(item.status)} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>{item.offerTitle}</Text>
                <View style={styles.rowBottom}>
                  <Text style={[theme.type.code, styles.last4, { color: colors.textMuted }]}>••••{item.codeLast4}</Text>
                  <Text style={[theme.type.caption, { color: colors.textFaint }]}>
                    {item.status === 'redeemed'
                      ? `Used ${formatDate(item.redeemedAt)}`
                      : `${item.status === 'expired' ? 'Expired' : 'Expires'} ${formatDate(item.expiresAt)}`}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, flexGrow: 1 },
  row: { flexDirection: 'row', marginBottom: 10, borderWidth: StyleSheet.hairlineWidth * 2, overflow: 'hidden' },
  stripe: { width: 4 },
  rowBody: { flex: 1, padding: 16 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  partner: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  last4: { fontSize: 13, letterSpacing: 2 },
});
