import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { userMessageFor } from '../api/errors';
import { useTheme } from '../theme/theme';
import { Button } from './Button';

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center} accessibilityLabel={label}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export function EmptyView({ title, message }: { title: string; message?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.text, { color: theme.colors.textMuted }]}>{message}</Text> : null}
    </View>
  );
}

/** Shows the mapped user-facing message for any error; never raw server text. */
export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.center} accessibilityRole="alert">
      <Text testID="error-message" style={[styles.title, { color: theme.colors.danger }]}>
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
    <Text testID="inline-error" accessibilityRole="alert" style={[styles.inline, { color: theme.colors.danger }]}>
      {userMessageFor(error)}
    </Text>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  text: { fontSize: 15, marginTop: 8, textAlign: 'center' },
  action: { marginTop: 16, minWidth: 160 },
  inline: { fontSize: 14, marginBottom: 12 },
});
