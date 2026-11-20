import React from 'react';
import { StyleSheet, Text } from 'react-native';
import type { Member } from '../../shared/api/types';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Screen } from '../../shared/components/Screen';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { useTheme } from '../../shared/theme/theme';
import { formatMoney } from '../../shared/utils/format';
import { useAuth } from '../auth/AuthProvider';
import { useMember } from '../membership/membership-api';
import { membershipBadge } from '../membership/membership-status';

export function AwaitingActivationScreen({ member }: { member: Member }) {
  const theme = useTheme();
  const { signOut } = useAuth();
  const refresh = useMember();

  return (
    <Screen refreshing={refresh.isRefetching} onRefresh={() => refresh.refetch()}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Almost there</Text>
      <Card>
        <StatusBadge {...membershipBadge(member.membershipStatus)} />
        <Text style={[styles.memberId, { color: theme.colors.text }]}>{member.memberId}</Text>
        {member.plan ? (
          <Text style={[styles.body, { color: theme.colors.text }]}>
            {member.plan.name}: {formatMoney(member.plan.priceCents)}
            {member.plan.registrationFeeCents > 0 ? ` + ${formatMoney(member.plan.registrationFeeCents)} registration` : ''}
          </Text>
        ) : null}
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          Your membership is awaiting activation. Once The Bonus Club confirms your payment, your card and partner offers unlock.
          Quote your member ID {member.memberId} when you pay.
        </Text>
      </Card>
      <Button title="Check status" onPress={() => refresh.refetch()} loading={refresh.isRefetching} />
      <Text style={[styles.hint, { color: theme.colors.textMuted }]}>You can also pull down to refresh.</Text>
      <Button title="Sign out" variant="secondary" onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  memberId: { fontSize: 20, fontWeight: '700', marginTop: 12 },
  body: { fontSize: 15, marginTop: 8 },
  hint: { fontSize: 13, textAlign: 'center', marginVertical: 12 },
});
