import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Member } from '../../shared/api/types';
import { BrandMark } from '../../shared/components/BrandMark';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Screen } from '../../shared/components/Screen';
import { InfoRow } from '../../shared/components/Section';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { useTheme, withAlpha } from '../../shared/theme/theme';
import { formatMoney } from '../../shared/utils/format';
import { useAuth } from '../auth/AuthProvider';
import { useMember } from '../membership/membership-api';
import { membershipBadge } from '../membership/membership-status';
import { StepIndicator } from './StepIndicator';

export function AwaitingActivationScreen({ member }: { member: Member }) {
  const theme = useTheme();
  const { colors } = theme;
  const { signOut } = useAuth();
  const refresh = useMember();

  return (
    <Screen topInset refreshing={refresh.isRefetching} onRefresh={() => refresh.refetch()}>
      <StepIndicator current={2} />
      <View style={styles.hero}>
        <BrandMark size={72} />
        <Text accessibilityRole="header" style={[theme.type.display, styles.title, { color: colors.text }]}>
          Almost there
        </Text>
        <StatusBadge {...membershipBadge(member.membershipStatus)} />
        <Text style={[theme.type.body, styles.body, { color: colors.textMuted }]}>
          Your membership is awaiting activation. Once The Bonus Club confirms your payment, your card and partner offers unlock.
        </Text>
      </View>

      <View style={[styles.idBox, { borderColor: withAlpha(colors.primary, 0.45), backgroundColor: withAlpha(colors.primary, 0.07), borderRadius: theme.radius }]}>
        <Text style={[theme.type.overline, { color: colors.textMuted }]}>Quote this member ID when you pay</Text>
        <Text selectable style={[theme.type.code, styles.memberId, { color: colors.primaryBright }]}>
          {member.memberId}
        </Text>
      </View>

      {member.plan ? (
        <Card>
          <InfoRow
            glyph="◆"
            label={member.plan.name}
            value={`${formatMoney(member.plan.priceCents)}${member.plan.registrationFeeCents > 0 ? ` + ${formatMoney(member.plan.registrationFeeCents)} registration` : ''}`}
          />
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button title="Check status" onPress={() => refresh.refetch()} loading={refresh.isRefetching} />
        <Text style={[theme.type.caption, styles.hint, { color: colors.textFaint }]}>You can also pull down to refresh.</Text>
        <Button title="Sign out" variant="ghost" onPress={() => signOut()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 24 },
  title: { marginTop: 18, marginBottom: 12 },
  body: { textAlign: 'center', marginTop: 14 },
  idBox: { borderWidth: 1, padding: 18, alignItems: 'center', marginBottom: 12 },
  memberId: { fontSize: 28, marginTop: 8 },
  actions: { marginTop: 12 },
  hint: { textAlign: 'center', marginVertical: 10 },
});
