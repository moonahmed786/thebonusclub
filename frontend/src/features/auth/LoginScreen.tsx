import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AuthStackParams } from '../../app/navigation-types';
import { Button } from '../../shared/components/Button';
import { Screen } from '../../shared/components/Screen';
import { InlineError } from '../../shared/components/StateViews';
import { TextField } from '../../shared/components/TextField';
import { useTheme } from '../../shared/theme/theme';
import { useAuth } from './AuthProvider';

type Props = NativeStackScreenProps<AuthStackParams, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
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
    <Screen>
      <Text style={[styles.title, { color: theme.colors.text }]}>The Bonus Club</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Sign in to your membership</Text>
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" />
      <InlineError error={error} />
      {adminNotice ? <Text style={[styles.notice, { color: theme.colors.danger }]}>Admin accounts cannot use the member app.</Text> : null}
      <Button title="Sign in" onPress={submit} loading={busy} disabled={!email || !password} />
      <View style={styles.gap} />
      <Button title="Create an account" variant="secondary" onPress={() => navigation.navigate('Register')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginTop: 24 },
  subtitle: { fontSize: 16, marginTop: 4, marginBottom: 24 },
  notice: { marginBottom: 12 },
  gap: { height: 12 },
});
