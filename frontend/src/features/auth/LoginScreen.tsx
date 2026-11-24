import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { AuthStackParams } from '../../app/navigation-types';
import { BrandMark, Wordmark } from '../../shared/components/BrandMark';
import { Button } from '../../shared/components/Button';
import { Screen } from '../../shared/components/Screen';
import { InlineError } from '../../shared/components/StateViews';
import { TextField } from '../../shared/components/TextField';
import { useTheme, withAlpha } from '../../shared/theme/theme';
import { useAuth } from './AuthProvider';

type Props = NativeStackScreenProps<AuthStackParams, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [adminNotice, setAdminNotice] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setAdminNotice(false);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      if (err instanceof Error && err.message === 'ADMIN_ACCOUNT') setAdminNotice(true);
      else setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen topInset>
        <View style={styles.hero}>
          <BrandMark size={88} />
          <View style={styles.wordmark}>
            <Wordmark size={12} />
          </View>
          <Text style={[theme.type.display, styles.title, { color: colors.text }]}>Welcome back</Text>
          <Text style={[theme.type.body, { color: colors.textMuted }]}>Sign in to your membership</Text>
        </View>

        <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" returnKeyType="next" />
        <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" returnKeyType="go" onSubmitEditing={() => email && password && submit()} />
        <InlineError error={error} />
        {adminNotice ? (
          <View style={[styles.notice, { backgroundColor: withAlpha(colors.danger, 0.1), borderColor: withAlpha(colors.danger, 0.4), borderRadius: theme.radiusSm }]}>
            <Text style={{ color: colors.danger }}>Admin accounts cannot use the member app.</Text>
          </View>
        ) : null}
        <Button title="Sign in" onPress={submit} loading={busy} disabled={!email || !password} />

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[theme.type.caption, { color: colors.textFaint }]}>New to the club?</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>
        <Button title="Create an account" variant="secondary" onPress={() => navigation.navigate('Register')} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hero: { alignItems: 'center', marginTop: 8, marginBottom: 32 },
  wordmark: { marginTop: 18 },
  title: { marginTop: 22, marginBottom: 6 },
  notice: { borderWidth: 1, padding: 12, marginBottom: 14 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
});
