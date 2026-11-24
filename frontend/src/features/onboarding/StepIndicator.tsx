import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../shared/theme/theme';

const STEPS = ['Your details', 'Your plan', 'Activation'];

/** Three-step onboarding progress: details → plan → activation. `current` is 0-based. */
export function StepIndicator({ current }: { current: number }) {
  const theme = useTheme();
  const { colors } = theme;
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={`Step ${current + 1} of ${STEPS.length}: ${STEPS[current]}`} style={styles.wrap}>
      <View style={styles.bars}>
        {STEPS.map((step, i) => (
          <View key={step} style={[styles.bar, { backgroundColor: i <= current ? colors.primary : colors.border }]} />
        ))}
      </View>
      <Text style={[theme.type.overline, { color: colors.primary }]}>
        Step {current + 1} of {STEPS.length} · {STEPS[current]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  bars: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
});
