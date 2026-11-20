import Clipboard from '@react-native-clipboard/clipboard';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Screen } from '../../shared/components/Screen';
import { ErrorView, InlineError, LoadingView } from '../../shared/components/StateViews';
import { useTheme } from '../../shared/theme/theme';
import { formatDateTime } from '../../shared/utils/format';
import { useIssueVerificationCode, useMembershipCard } from './membership-api';
import { MembershipCardView } from './MembershipCardView';

export function CardScreen() {
  const theme = useTheme();
  const card = useMembershipCard();
  const issue = useIssueVerificationCode();
  const [copied, setCopied] = useState(false);

  if (card.isPending) return <LoadingView label="Loading your card…" />;
  if (card.isError) return <ErrorView error={card.error} onRetry={() => card.refetch()} />;

  const { card: data, savedAt, fromCache } = card.data;
  const active = data.membershipStatus === 'active';
  const code = issue.data;

  const copy = () => {
    if (!code) return;
    Clipboard.setString(code.code);
    setCopied(true);
  };

  return (
    <Screen refreshing={card.isRefetching} onRefresh={() => card.refetch()}>
      <MembershipCardView card={data} />
      <Text style={[styles.updated, { color: fromCache ? theme.colors.warning : theme.colors.textMuted }]}>
        {fromCache ? 'Offline · ' : ''}Last updated {formatDateTime(savedAt)}
      </Text>

      {active ? (
        <Card>
          <Text style={[styles.heading, { color: theme.colors.text }]}>Verification code</Text>
          <Text style={[styles.help, { color: theme.colors.textMuted }]}>
            Show this code to the cashier. It works once and expires after a few minutes.
          </Text>
          {code ? (
            <View style={styles.codeBox}>
              <Text testID="verification-code" selectable style={[styles.code, { color: theme.colors.text }]} accessibilityLabel={`Code ${code.code.split('').join(' ')}`}>
                {code.code}
              </Text>
              <Text style={[styles.help, { color: theme.colors.textMuted }]}>Valid until {formatDateTime(code.expiresAt)}</Text>
              <Button title={copied ? 'Copied' : 'Copy code'} variant="secondary" onPress={copy} />
            </View>
          ) : null}
          <InlineError error={issue.error} />
          <Button
            title={code ? 'Get a new code' : 'Show verification code'}
            onPress={() => {
              setCopied(false);
              issue.mutate();
            }}
            loading={issue.isPending}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  updated: { fontSize: 13, marginBottom: 16 },
  heading: { fontSize: 18, fontWeight: '700' },
  help: { fontSize: 14, marginTop: 6, marginBottom: 12 },
  codeBox: { alignItems: 'stretch', marginBottom: 12 },
  code: { fontSize: 40, fontWeight: '800', letterSpacing: 4, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
