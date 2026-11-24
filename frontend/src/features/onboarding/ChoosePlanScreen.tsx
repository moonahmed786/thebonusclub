import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../shared/components/Button';
import { Screen } from '../../shared/components/Screen';
import { EmptyView, ErrorView, InlineError, LoadingView } from '../../shared/components/StateViews';
import { useTheme, withAlpha } from '../../shared/theme/theme';
import { formatMoney } from '../../shared/utils/format';
import { usePlans, useSelectPlan } from '../membership/membership-api';
import { StepIndicator } from './StepIndicator';

function period(months: number): string {
  return months === 12 ? 'year' : months === 1 ? 'month' : `${months} months`;
}

export function ChoosePlanScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const plans = usePlans();
  const select = useSelectPlan();
  const [chosen, setChosen] = useState<string | null>(null);

  if (plans.isPending) return <LoadingView label="Loading plans…" />;
  if (plans.isError) return <ErrorView error={plans.error} onRetry={() => plans.refetch()} />;
  if (plans.data.length === 0) return <EmptyView title="No plans available" message="Please check back soon." />;

  return (
    <Screen
      topInset
      footer={
        <>
          <InlineError error={select.error} />
          <Button title="Choose plan" onPress={() => chosen && select.mutate(chosen)} disabled={!chosen} loading={select.isPending} />
        </>
      }>
      <StepIndicator current={1} />
      <Text accessibilityRole="header" style={[theme.type.display, styles.title, { color: colors.text }]}>
        Choose your membership
      </Text>
      <Text style={[theme.type.body, styles.help, { color: colors.textMuted }]}>
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
            style={({ pressed }) => [
              styles.plan,
              {
                borderRadius: theme.radiusLg,
                minHeight: theme.minTapSize,
                backgroundColor: selected ? withAlpha(colors.primary, 0.08) : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <View style={styles.planTop}>
              <Text style={[theme.type.overline, { color: selected ? colors.primary : colors.textMuted }]}>{plan.name}</Text>
              <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.borderStrong }]}>
                {selected ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}
              </View>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.text }]}>{formatMoney(plan.priceCents)}</Text>
              <Text style={[theme.type.body, { color: colors.textMuted }]}> / {period(plan.durationMonths)}</Text>
            </View>
            {plan.registrationFeeCents > 0 ? (
              <Text style={[theme.type.caption, { color: colors.textMuted }]}>+ {formatMoney(plan.registrationFeeCents)} one-time registration</Text>
            ) : null}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 6 },
  help: { marginBottom: 24 },
  plan: { borderWidth: 1.5, padding: 20, marginBottom: 14 },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10, marginBottom: 2 },
  price: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
});
