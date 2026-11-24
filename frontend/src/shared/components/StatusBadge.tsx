import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, withAlpha } from '../theme/theme';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'muted';

interface StatusBadgeProps {
  label: string;
  tone: BadgeTone;
  /** A text glyph so color is never the only signal. */
  icon: string;
}

export function StatusBadge({ label, tone, icon }: StatusBadgeProps) {
  const theme = useTheme();
  const color = tone === 'muted' ? theme.colors.textMuted : theme.colors[tone];
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[styles.badge, { borderColor: withAlpha(color, 0.45), backgroundColor: withAlpha(color, 0.14) }]}>
      <Text style={[styles.text, { color }]}>
        {icon} {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
});
