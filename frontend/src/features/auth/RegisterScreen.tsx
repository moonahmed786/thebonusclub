import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '../../shared/components/BrandMark';
import { Button } from '../../shared/components/Button';
import { Screen } from '../../shared/components/Screen';
import { InlineError } from '../../shared/components/StateViews';
import { TextField } from '../../shared/components/TextField';
import { useTheme } from '../../shared/theme/theme';
import { useAuth } from './AuthProvider';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterScreen() {
  const theme = useTheme();
  const { colors } = theme;
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
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}>
      <Screen>
        <View style={styles.hero}>
          <BrandMark size={56} />
          <Text style={[theme.type.title, styles.title, { color: colors.text }]}>Join The Bonus Club</Text>
          <Text style={[theme.type.body, styles.intro, { color: colors.textMuted }]}>
            Create your account with email and password. You'll add your details and choose a plan next.
          </Text>
        </View>
        <TextField label="Email" value={email} onChangeText={setEmail} error={emailError} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
        <TextField label="Password" value={password} onChangeText={setPassword} error={passwordError} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="8 to 72 characters" />
        <TextField label="Confirm password" value={confirm} onChangeText={setConfirm} error={confirmError} secureTextEntry textContentType="newPassword" />
        <InlineError error={error} />
        <Button title="Create account" onPress={submit} loading={busy} disabled={!canSubmit} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hero: { alignItems: 'center', marginBottom: 28 },
  title: { marginTop: 16 },
  intro: { textAlign: 'center', marginTop: 8 },
});
