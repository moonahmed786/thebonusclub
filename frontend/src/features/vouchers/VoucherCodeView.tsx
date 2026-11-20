import Clipboard from '@react-native-clipboard/clipboard';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { VoucherStatus } from '../../shared/api/types';
import { Button } from '../../shared/components/Button';
import { useTheme } from '../../shared/theme/theme';
import { isCodeUsable } from './voucher-status';

/** Large, cashier-readable code. Used or expired codes are struck through and cannot be copied. */
export function VoucherCodeView({ code, status }: { code: string; status: VoucherStatus }) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const usable = isCodeUsable(status);
  return (
    <View style={styles.box}>
      <Text
        testID="voucher-code"
        selectable={usable}
        style={[styles.code, !usable && styles.used, { color: usable ? theme.colors.text : theme.colors.disabled }]}>
        {code}
      </Text>
      {usable ? (
        <>
          <Text style={[styles.help, { color: theme.colors.textMuted }]}>Show this code at checkout, or enter it on the partner's site. It works once.</Text>
          <Button
            title={copied ? 'Copied' : 'Copy code'}
            variant="secondary"
            onPress={() => {
              Clipboard.setString(code);
              setCopied(true);
            }}
          />
        </>
      ) : (
        <Text style={[styles.help, { color: theme.colors.textMuted }]}>{status === 'redeemed' ? 'This code has been used.' : 'This code has expired.'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginVertical: 12 },
  code: { fontSize: 32, fontWeight: '800', letterSpacing: 3, textAlign: 'center', fontVariant: ['tabular-nums'] },
  help: { fontSize: 14, textAlign: 'center', marginVertical: 10 },
  used: { textDecorationLine: 'line-through' },
});
