import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MembershipCard } from '../../shared/api/types';
import { Wordmark } from '../../shared/components/BrandMark';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { useTheme, withAlpha } from '../../shared/theme/theme';
import { formatDate } from '../../shared/utils/format';
import { membershipBadge } from './membership-status';

/** The digital membership card, styled as a black metal card with gold detailing. Inactive or expired cards are dimmed. */
export function MembershipCardView({ card }: { card: MembershipCard }) {
  const theme = useTheme();
  const { colors } = theme;
  const active = card.membershipStatus === 'active';
  const badge = membershipBadge(card.membershipStatus);
  const gold = active ? colors.primary : colors.textFaint;

  return (
    <View
      testID="membership-card"
      accessibilityLabel={`Membership card, ${badge.label}`}
      style={[styles.card, { borderRadius: theme.radiusLg, borderColor: withAlpha(gold, 0.55), backgroundColor: colors.cardFace }, !active && styles.dimmed]}>
      {/* Layered sheens stand in for a brushed-metal gradient without an extra dependency. */}
      <View pointerEvents="none" style={[styles.sheen, { backgroundColor: withAlpha(colors.primary, active ? 0.07 : 0.03) }]} />
      <View pointerEvents="none" style={[styles.sheen2, { backgroundColor: withAlpha('#FFFFFF', 0.025) }]} />

      <View style={styles.row}>
        <Wordmark size={11} />
        <StatusBadge {...badge} />
      </View>

      <View style={[styles.chip, { borderColor: withAlpha(gold, 0.7), backgroundColor: withAlpha(gold, 0.18) }]}>
        <View style={[styles.chipLine, { backgroundColor: withAlpha(gold, 0.6) }]} />
        <View style={[styles.chipLine, { backgroundColor: withAlpha(gold, 0.6) }]} />
      </View>

      <Text testID="member-id" style={[theme.type.code, styles.memberId, { color: active ? colors.primaryBright : colors.textMuted }]}>
        {card.memberId}
      </Text>

      <View style={styles.footer}>
        <View style={styles.footerCol}>
          <Text style={[styles.label, { color: colors.textFaint }]}>MEMBER</Text>
          <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
            {card.name ?? 'Member'}
          </Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={[styles.label, { color: colors.textFaint }]}>{card.planName ?? 'No plan'}</Text>
          <Text style={[styles.value, { color: colors.text }]}>{card.expiresAt ? `Expires ${formatDate(card.expiresAt)}` : 'Not activated yet'}</Text>
        </View>
      </View>

      {!active ? (
        <Text style={[styles.notice, { color: colors.textMuted, borderTopColor: colors.border }]}>
          {card.membershipStatus === 'expired'
            ? 'Your membership has expired. Renew to use offers again.'
            : 'Your membership is waiting for activation. Offers unlock once it is active.'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 22, marginBottom: 12, overflow: 'hidden', minHeight: 210 },
  dimmed: { opacity: 0.82 },
  sheen: { position: 'absolute', top: -120, right: -80, width: 300, height: 300, borderRadius: 150 },
  sheen2: { position: 'absolute', bottom: -160, left: -60, width: 320, height: 240, borderRadius: 160, transform: [{ rotate: '-18deg' }] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { width: 44, height: 32, borderRadius: 7, borderWidth: 1, marginTop: 26, justifyContent: 'center', gap: 6, paddingHorizontal: 6 },
  chipLine: { height: 1 },
  memberId: { fontSize: 24, marginTop: 18 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18, gap: 12 },
  footerCol: { flex: 1 },
  footerRight: { alignItems: 'flex-end' },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 3 },
  value: { fontSize: 15, fontWeight: '700' },
  notice: { fontSize: 14, lineHeight: 20, marginTop: 18, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
});
