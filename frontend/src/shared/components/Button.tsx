import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  /** primary: solid gold. secondary: gold outline. ghost: gold text only (for header and inline actions). */
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, accessibilityHint, testID }: ButtonProps) {
  const theme = useTheme();
  const { colors } = theme;
  const isDisabled = disabled || loading;
  const primary = variant === 'primary';
  const ghost = variant === 'ghost';

  const background = primary ? (isDisabled ? colors.disabled : colors.primary) : 'transparent';
  const borderColor = primary ? background : ghost ? 'transparent' : isDisabled ? colors.disabled : colors.primary;
  const color = primary ? (isDisabled ? colors.textMuted : colors.onPrimary) : isDisabled ? colors.disabled : colors.primary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={accessibilityHint}
      disabled={isDisabled}
      onPress={onPress}
      hitSlop={ghost ? 8 : undefined}
      style={({ pressed }) => [
        styles.button,
        ghost ? styles.ghost : styles.solid,
        {
          minHeight: ghost ? theme.minTapSize : 54,
          borderRadius: theme.radius,
          backgroundColor: background,
          borderColor,
          opacity: pressed ? 0.78 : 1,
          transform: [{ scale: pressed && !ghost ? 0.985 : 1 }],
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.label, ghost && styles.ghostLabel, { color }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  solid: { paddingHorizontal: 20, paddingVertical: 14 },
  ghost: { paddingHorizontal: 8 },
  label: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  ghostLabel: { fontSize: 15, fontWeight: '600' },
});
