import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/theme';

/** Small gold section label with an optional count or note on the right. */
export function SectionTitle({ title, note }: { title: string; note?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={[theme.type.overline, { color: theme.colors.primary }]}>
        {title}
      </Text>
      {note ? <Text style={[theme.type.caption, { color: theme.colors.textFaint }]}>{note}</Text> : null}
    </View>
  );
}

/** One labelled line inside a card: a glyph, a label and a value. */
export function InfoRow({ glyph, label, value, valueColor }: { glyph: string; label: string; value: string; valueColor?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.info, { minHeight: theme.minTapSize }]}>
      <Text style={[styles.glyph, { color: theme.colors.primary }]}>{glyph}</Text>
      <View style={styles.infoText}>
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{label}</Text>
        <Text style={[theme.type.body, { color: valueColor ?? theme.colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  glyph: { fontSize: 16, width: 22, textAlign: 'center' },
  infoText: { flex: 1 },
});
