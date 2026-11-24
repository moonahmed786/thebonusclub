import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, accessibilityHint, testID }: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const primary = variant === 'primary';
  const background = primary ? (isDisabled ? theme.colors.disabled : theme.colors.primary) : 'transparent';
  const color = primary ? theme.colors.onPrimary : isDisabled ? theme.colors.disabled : theme.colors.primary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={accessibilityHint}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: theme.minTapSize,
          borderRadius: theme.radius,
          backgroundColor: background,
          borderColor: primary ? background : theme.colors.primary,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      {loading ? <ActivityIndicator color={color} /> : <Text style={[styles.label, { color }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1 },
  label: { fontSize: 16, fontWeight: '600' },
});
