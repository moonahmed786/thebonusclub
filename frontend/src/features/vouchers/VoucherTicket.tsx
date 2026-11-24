import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { VoucherStatus } from '../../shared/api/types';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { useTheme, withAlpha } from '../../shared/theme/theme';
import { isCodeUsable, voucherBadge } from './voucher-status';

interface VoucherTicketProps {
  partnerName: string;
  offerTitle: string;
  status: VoucherStatus;
  /** Lower half of the ticket: the code, or a note when the code is not on this device. */
  children: React.ReactNode;
  footer?: string;
}

/** A tear-off ticket: offer details on top, a perforated line, then the code. */
export function VoucherTicket({ partnerName, offerTitle, status, children, footer }: VoucherTicketProps) {
  const theme = useTheme();
  const { colors } = theme;
  const live = isCodeUsable(status);
  const edge = live ? withAlpha(colors.primary, 0.55) : colors.border;

  return (
    <View style={[styles.ticket, { backgroundColor: colors.surface, borderColor: edge, borderRadius: theme.radiusLg }]}>
      <View style={styles.top}>
        <View style={styles.topRow}>
          <Text style={[theme.type.overline, { color: live ? colors.primary : colors.textFaint }]} numberOfLines={1}>
            {partnerName}
          </Text>
          <StatusBadge {...voucherBadge(status)} />
        </View>
        <Text style={[theme.type.title, styles.title, { color: live ? colors.text : colors.textMuted }]}>{offerTitle}</Text>
      </View>

      <View style={styles.perforation}>
        <View style={[styles.notch, styles.notchLeft, { backgroundColor: colors.background, borderColor: edge }]} />
        <View style={[styles.dashes, { borderColor: colors.borderStrong }]} />
        <View style={[styles.notch, styles.notchRight, { backgroundColor: colors.background, borderColor: edge }]} />
      </View>

      <View style={styles.bottom}>
        {children}
        {footer ? <Text style={[theme.type.caption, styles.footer, { color: colors.textFaint }]}>{footer}</Text> : null}
      </View>
    </View>
  );
}

const NOTCH = 22;

const styles = StyleSheet.create({
  ticket: { borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  top: { padding: 20, paddingBottom: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { marginTop: 10 },
  perforation: { height: NOTCH, justifyContent: 'center' },
  dashes: { marginHorizontal: NOTCH, borderTopWidth: 1.5, borderStyle: 'dashed' },
  notch: { position: 'absolute', width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, borderWidth: 1 },
  notchLeft: { left: -NOTCH / 2 },
  notchRight: { right: -NOTCH / 2 },
  bottom: { padding: 20, paddingTop: 12 },
  footer: { textAlign: 'center', marginTop: 4 },
});
