import Clipboard from '@react-native-clipboard/clipboard';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { VoucherStatus } from '../../shared/api/types';
import { Button } from '../../shared/components/Button';
import { useTheme, withAlpha } from '../../shared/theme/theme';
import { isCodeUsable } from './voucher-status';

/** Large, cashier-readable code. Used or expired codes are struck through and cannot be copied. */
export function VoucherCodeView({ code, status }: { code: string; status: VoucherStatus }) {
  const theme = useTheme();
  const { colors } = theme;
  const [copied, setCopied] = useState(false);
  const usable = isCodeUsable(status);
  return (
    <View style={styles.box}>
      <View
        style={[
          styles.codeWell,
          {
            borderRadius: theme.radius,
            backgroundColor: usable ? withAlpha(colors.primary, 0.08) : colors.surfaceRaised,
            borderColor: usable ? withAlpha(colors.primary, 0.4) : colors.border,
          },
        ]}>
        <Text
          testID="voucher-code"
          selectable={usable}
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[theme.type.code, styles.code, !usable && styles.used, { color: usable ? colors.primaryBright : colors.disabled }]}>
          {code}
        </Text>
      </View>
      {usable ? (
        <>
          <Text style={[styles.help, { color: colors.textMuted }]}>Show this code at checkout, or enter it on the partner's site. It works once.</Text>
          <Button
            title={copied ? 'Copied ✓' : 'Copy code'}
            variant="secondary"
            onPress={() => {
              Clipboard.setString(code);
              setCopied(true);
            }}
          />
        </>
      ) : (
        <Text style={[styles.help, { color: colors.textMuted }]}>{status === 'redeemed' ? 'This code has been used.' : 'This code has expired.'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginVertical: 4 },
  codeWell: { borderWidth: 1, paddingVertical: 18, paddingHorizontal: 12 },
  code: { fontSize: 30, textAlign: 'center' },
  help: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginVertical: 14 },
  used: { textDecorationLine: 'line-through' },
});
