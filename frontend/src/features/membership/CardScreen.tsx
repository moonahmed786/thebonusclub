import Clipboard from '@react-native-clipboard/clipboard';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Screen } from '../../shared/components/Screen';
import { SectionTitle } from '../../shared/components/Section';
import { ErrorView, InlineError, LoadingView } from '../../shared/components/StateViews';
import { useTheme, withAlpha } from '../../shared/theme/theme';
import { formatDateTime } from '../../shared/utils/format';
import { useAuth } from '../auth/AuthProvider';
import { useIssueVerificationCode, useMembershipCard } from './membership-api';
import { MembershipCardView } from './MembershipCardView';

function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function CardScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { signOut } = useAuth();
  const card = useMembershipCard();
  const issue = useIssueVerificationCode();
  const [copied, setCopied] = useState(false);

  if (card.isPending) return <LoadingView label="Loading your card…" />;
  if (card.isError) return <ErrorView error={card.error} onRetry={() => card.refetch()} />;

  const { card: data, savedAt, fromCache } = card.data;
  const active = data.membershipStatus === 'active';
  const code = issue.data;
  const firstName = data.name?.split(' ')[0];

  const copy = () => {
    if (!code) return;
    Clipboard.setString(code.code);
    setCopied(true);
  };

  return (
    <Screen
      refreshing={card.isRefetching}
      onRefresh={() => card.refetch()}
      header={{
        overline: greeting(),
        title: firstName ?? 'Your card',
        right: <Button title="Sign out" variant="ghost" onPress={() => signOut()} />,
      }}>
      <MembershipCardView card={data} />
      <Text style={[theme.type.caption, styles.updated, { color: fromCache ? colors.warning : colors.textFaint }]}>
        {fromCache ? '● Offline · ' : ''}Last updated {formatDateTime(savedAt)}
      </Text>

      {active ? (
        <>
          <SectionTitle title="Verification code" />
          <Card>
            <Text style={[theme.type.body, { color: colors.textMuted }]}>
              Show this code to the cashier to prove your membership. It works once and expires after a few minutes.
            </Text>
            {code ? (
              <View style={[styles.codeBox, { backgroundColor: withAlpha(colors.primary, 0.08), borderColor: withAlpha(colors.primary, 0.4), borderRadius: theme.radius }]}>
                <Text
                  testID="verification-code"
                  selectable
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[theme.type.code, styles.code, { color: colors.primaryBright }]}
                  accessibilityLabel={`Code ${code.code.split('').join(' ')}`}>
                  {code.code}
                </Text>
                <Text style={[theme.type.caption, styles.valid, { color: colors.textMuted }]}>Valid until {formatDateTime(code.expiresAt)}</Text>
                <Button title={copied ? 'Copied ✓' : 'Copy code'} variant="secondary" onPress={copy} />
              </View>
            ) : null}
            <View style={styles.gap} />
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
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  updated: { textAlign: 'center', marginBottom: 20 },
  codeBox: { borderWidth: 1, padding: 18, marginTop: 16, alignItems: 'stretch' },
  code: { fontSize: 38, textAlign: 'center' },
  valid: { textAlign: 'center', marginTop: 6, marginBottom: 14 },
  gap: { height: 16 },
});
