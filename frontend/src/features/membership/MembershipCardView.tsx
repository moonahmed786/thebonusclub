import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MembershipCard } from '../../shared/api/types';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { useTheme } from '../../shared/theme/theme';
import { formatDate } from '../../shared/utils/format';
import { membershipBadge } from './membership-status';

/** The digital membership card. Inactive or expired cards render in a clearly disabled state. */
export function MembershipCardView({ card }: { card: MembershipCard }) {
  const theme = useTheme();
  const active = card.membershipStatus === 'active';
  const badge = membershipBadge(card.membershipStatus);
  return (
    <View
      testID="membership-card"
      accessibilityLabel={`Membership card, ${badge.label}`}
      style={[
        styles.card,
        {
          borderRadius: theme.radius * 1.5,
          backgroundColor: active ? theme.colors.primary : theme.colors.surface,
          borderColor: active ? theme.colors.primary : theme.colors.border,
        },
        !active && styles.disabled,
      ]}>
      <View style={styles.row}>
        <Text style={[styles.brand, { color: active ? theme.colors.onPrimary : theme.colors.textMuted }]}>THE BONUS CLUB</Text>
        <View style={[styles.badgeWrap, { backgroundColor: theme.colors.surface }]}>
          <StatusBadge {...badge} />
        </View>
      </View>
      <Text style={[styles.name, { color: active ? theme.colors.onPrimary : theme.colors.text }]}>{card.name ?? 'Member'}</Text>
      <Text testID="member-id" style={[styles.memberId, { color: active ? theme.colors.onPrimary : theme.colors.text }]}>
        {card.memberId}
      </Text>
      <Text style={[styles.meta, { color: active ? theme.colors.onPrimary : theme.colors.textMuted }]}>
        {card.planName ?? 'No plan'} · {card.expiresAt ? `Expires ${formatDate(card.expiresAt)}` : 'Not activated yet'}
      </Text>
      {!active ? (
        <Text style={[styles.notice, { color: theme.colors.textMuted }]}>
          {card.membershipStatus === 'expired'
            ? 'Your membership has expired. Renew to use offers again.'
            : 'Your membership is waiting for activation. Offers unlock once it is active.'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 20, marginBottom: 16, minHeight: 190 },
  disabled: { opacity: 0.75 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  badgeWrap: { borderRadius: 999 },
  name: { fontSize: 22, fontWeight: '700', marginTop: 28 },
  memberId: { fontSize: 20, fontWeight: '600', letterSpacing: 1, marginTop: 4 },
  meta: { fontSize: 14, marginTop: 8 },
  notice: { fontSize: 14, marginTop: 12 },
});
