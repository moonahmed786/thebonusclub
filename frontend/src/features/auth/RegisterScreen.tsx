import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../../shared/components/Button';
import { Screen } from '../../shared/components/Screen';
import { InlineError } from '../../shared/components/StateViews';
import { TextField } from '../../shared/components/TextField';
import { useTheme } from '../../shared/theme/theme';
import { useAuth } from './AuthProvider';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterScreen() {
  const theme = useTheme();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const emailError = email && !EMAIL_PATTERN.test(email.trim()) ? 'Enter a valid email address.' : undefined;
  const passwordError = password && (password.length < 8 || password.length > 72) ? 'Use 8 to 72 characters.' : undefined;
  const confirmError = confirm && confirm !== password ? 'Passwords do not match.' : undefined;
  const canSubmit = !!email && !!password && confirm === password && !emailError && !passwordError;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signUp({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Text style={[styles.intro, { color: theme.colors.textMuted }]}>
        Create your account with email and password. You'll add your details and choose a plan next.
      </Text>
      <TextField label="Email" value={email} onChangeText={setEmail} error={emailError} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <TextField label="Password" value={password} onChangeText={setPassword} error={passwordError} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <TextField label="Confirm password" value={confirm} onChangeText={setConfirm} error={confirmError} secureTextEntry textContentType="newPassword" />
      <InlineError error={error} />
      <Button title="Create account" onPress={submit} loading={busy} disabled={!canSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 15, marginBottom: 20 },
});
