import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { Member } from '../../shared/api/types';
import { Button } from '../../shared/components/Button';
import { Screen } from '../../shared/components/Screen';
import { InlineError } from '../../shared/components/StateViews';
import { TextField } from '../../shared/components/TextField';
import { useTheme } from '../../shared/theme/theme';
import { isValidBirthday } from '../../shared/utils/format';
import { useUpdateProfile } from '../membership/membership-api';
import { StepIndicator } from './StepIndicator';

const PHONE_PATTERN = /^[+0-9 ()-]{6,20}$/;

export function ProfileSetupScreen({ member }: { member: Member }) {
  const theme = useTheme();
  const { colors } = theme;
  const update = useUpdateProfile();
  const [firstName, setFirstName] = useState(member.firstName ?? '');
  const [lastName, setLastName] = useState(member.lastName ?? '');
  const [phone, setPhone] = useState(member.phone ?? '');
  const [address, setAddress] = useState(member.address ?? '');
  const [birthday, setBirthday] = useState(member.birthday ?? '');

  const phoneError = phone && !PHONE_PATTERN.test(phone) ? 'Use digits, spaces, +, - or brackets.' : undefined;
  const birthdayError = birthday && !isValidBirthday(birthday) ? 'Use the format YYYY-MM-DD.' : undefined;
  const canSave = firstName.trim() && lastName.trim() && !phoneError && !birthdayError;

  const save = () =>
    update.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      birthday: birthday || undefined,
    });

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        topInset
        footer={
          <>
            <InlineError error={update.error} />
            <Button title="Continue" onPress={save} loading={update.isPending} disabled={!canSave} />
          </>
        }>
        <StepIndicator current={0} />
        <Text accessibilityRole="header" style={[theme.type.display, styles.title, { color: colors.text }]}>
          Tell us about you
        </Text>
        <Text style={[theme.type.body, styles.help, { color: colors.textMuted }]}>Only you and our membership team can see these.</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <TextField label="First name" value={firstName} onChangeText={setFirstName} autoComplete="given-name" textContentType="givenName" />
          </View>
          <View style={styles.half}>
            <TextField label="Last name" value={lastName} onChangeText={setLastName} autoComplete="family-name" textContentType="familyName" />
          </View>
        </View>
        <TextField label="Phone · optional" value={phone} onChangeText={setPhone} error={phoneError} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
        <TextField label="Address · optional" value={address} onChangeText={setAddress} autoComplete="street-address" textContentType="fullStreetAddress" multiline />
        <TextField label="Birthday · optional" value={birthday} onChangeText={setBirthday} error={birthdayError} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  title: { marginBottom: 6 },
  help: { marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});
