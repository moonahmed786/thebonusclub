import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Button } from '../../shared/components/Button';
import { Screen } from '../../shared/components/Screen';
import { EmptyView, ErrorView, InlineError, LoadingView } from '../../shared/components/StateViews';
import { useTheme } from '../../shared/theme/theme';
import { formatMoney } from '../../shared/utils/format';
import { usePlans, useSelectPlan } from '../membership/membership-api';

export function ChoosePlanScreen() {
  const theme = useTheme();
  const plans = usePlans();
  const select = useSelectPlan();
  const [chosen, setChosen] = useState<string | null>(null);

  if (plans.isPending) return <LoadingView label="Loading plans…" />;
  if (plans.isError) return <ErrorView error={plans.error} onRetry={() => plans.refetch()} />;
  if (plans.data.length === 0) return <EmptyView title="No plans available" message="Please check back soon." />;

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.colors.text }]}>Choose your membership</Text>
      <Text style={[styles.help, { color: theme.colors.textMuted }]}>
        Payment is arranged with The Bonus Club directly. Your membership is activated once payment is confirmed.
      </Text>
      {plans.data.map((plan) => {
        const selected = chosen === plan.code;
        return (
          <Pressable
            key={plan.code}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setChosen(plan.code)}
            style={[
              styles.plan,
              { borderRadius: theme.radius, minHeight: theme.minTapSize, backgroundColor: theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.border },
            ]}>
            <Text style={[styles.planName, { color: theme.colors.text }]}>
              {selected ? '● ' : '○ '}
              {plan.name}
            </Text>
            <Text style={[styles.price, { color: theme.colors.text }]}>
              {formatMoney(plan.priceCents)} / {plan.durationMonths === 12 ? 'year' : plan.durationMonths === 1 ? 'month' : `${plan.durationMonths} months`}
            </Text>
            {plan.registrationFeeCents > 0 ? (
              <Text style={[styles.fee, { color: theme.colors.textMuted }]}>+ {formatMoney(plan.registrationFeeCents)} one-time registration</Text>
            ) : null}
          </Pressable>
        );
      })}
      <InlineError error={select.error} />
      <Button title="Choose plan" onPress={() => chosen && select.mutate(chosen)} disabled={!chosen} loading={select.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800' },
  help: { fontSize: 15, marginTop: 4, marginBottom: 20 },
  plan: { borderWidth: 2, padding: 16, marginBottom: 12 },
  planName: { fontSize: 17, fontWeight: '700' },
  price: { fontSize: 16, marginTop: 6 },
  fee: { fontSize: 14, marginTop: 2 },
});
