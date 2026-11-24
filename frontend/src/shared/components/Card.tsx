import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '../theme/theme';

interface CardProps extends ViewProps {
  /** Adds a thin gold accent along the left edge, for highlighted items such as offers. */
  accent?: boolean;
}

export function Card({ style, accent = false, ...props }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius,
          borderLeftColor: accent ? theme.colors.primary : theme.colors.border,
        },
        accent && styles.accent,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth * 2, padding: 16, marginBottom: 12 },
  accent: { borderLeftWidth: 3 },
});
