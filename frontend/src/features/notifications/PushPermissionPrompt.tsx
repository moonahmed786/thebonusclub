import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../shared/components/Button';
import { useTheme } from '../../shared/theme/theme';
import { registerDevice, requestPushPermission, shouldAskForPushPermission } from './push';

/**
 * Shown after sign-in (never on first launch) with a reason, before the system prompt.
 * Registers the device token once permission is granted.
 */
export function PushPermissionPrompt() {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    shouldAskForPushPermission().then(async (ask) => {
      if (cancelled) return;
      if (ask) setVisible(true);
      else unsubscribe = await registerDevice();
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const enable = async () => {
    setVisible(false);
    if (await requestPushPermission()) await registerDevice();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface, borderRadius: theme.radius }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Stay in the loop</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            Get a notification when your voucher is ready or used, and before your membership expires. No marketing.
          </Text>
          <Button title="Turn on notifications" onPress={enable} />
          <View style={styles.gap} />
          <Button title="Not now" variant="secondary" onPress={() => setVisible(false)} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { padding: 20 },
  title: { fontSize: 20, fontWeight: '800' },
  body: { fontSize: 15, marginVertical: 12 },
  gap: { height: 8 },
});
