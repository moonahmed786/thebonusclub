import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { userMessageFor } from '../api/errors';
import { useTheme, withAlpha } from '../theme/theme';
import { Button } from './Button';

function Glyph({ glyph, color }: { glyph: string; color: string }) {
  return (
    <View style={[styles.glyph, { backgroundColor: withAlpha(color, 0.12), borderColor: withAlpha(color, 0.35) }]}>
      <Text style={[styles.glyphText, { color }]}>{glyph}</Text>
    </View>
  );
}

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]} accessibilityLabel={label}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text style={[styles.text, { color: theme.colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export function EmptyView({ title, message, glyph = '✦' }: { title: string; message?: string; glyph?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Glyph glyph={glyph} color={theme.colors.primary} />
      <Text style={[theme.type.heading, styles.title, { color: theme.colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.text, { color: theme.colors.textMuted }]}>{message}</Text> : null}
    </View>
  );
}

/** Shows the mapped user-facing message for any error; never raw server text. */
export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]} accessibilityRole="alert">
      <Glyph glyph="!" color={theme.colors.danger} />
      <Text testID="error-message" style={[theme.type.heading, styles.title, { color: theme.colors.text }]}>
        {userMessageFor(error)}
      </Text>
      {onRetry ? (
        <View style={styles.action}>
          <Button title="Try again" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

export function InlineError({ error }: { error: unknown }) {
  const theme = useTheme();
  if (!error) return null;
  return (
    <View style={[styles.inlineBox, { backgroundColor: withAlpha(theme.colors.danger, 0.1), borderColor: withAlpha(theme.colors.danger, 0.4), borderRadius: theme.radiusSm }]}>
      <Text testID="inline-error" accessibilityRole="alert" style={[styles.inline, { color: theme.colors.danger }]}>
        {userMessageFor(error)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  glyph: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  glyphText: { fontSize: 26, fontWeight: '800' },
  title: { textAlign: 'center' },
  text: { fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: 'center' },
  action: { marginTop: 20, minWidth: 180 },
  inlineBox: { borderWidth: 1, padding: 12, marginBottom: 14 },
  inline: { fontSize: 14, lineHeight: 20 },
});
