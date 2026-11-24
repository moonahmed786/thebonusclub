import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { Member } from '../../shared/api/types';
import { Button } from '../../shared/components/Button';
import { Screen } from '../../shared/components/Screen';
import { InlineError } from '../../shared/components/StateViews';
import { TextField } from '../../shared/components/TextField';
import { useTheme } from '../../shared/theme/theme';
import { isValidBirthday } from '../../shared/utils/format';
import { useUpdateProfile } from '../membership/membership-api';

const PHONE_PATTERN = /^[+0-9 ()-]{6,20}$/;

export function ProfileSetupScreen({ member }: { member: Member }) {
  const theme = useTheme();
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
    <Screen>
      <Text style={[styles.title, { color: theme.colors.text }]}>Your details</Text>
      <Text style={[styles.help, { color: theme.colors.textMuted }]}>Only you and our membership team can see these.</Text>
      <TextField label="First name" value={firstName} onChangeText={setFirstName} autoComplete="given-name" textContentType="givenName" />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} autoComplete="family-name" textContentType="familyName" />
      <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} error={phoneError} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
      <TextField label="Address (optional)" value={address} onChangeText={setAddress} autoComplete="street-address" textContentType="fullStreetAddress" multiline />
      <TextField label="Birthday (optional)" value={birthday} onChangeText={setBirthday} error={birthdayError} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
      <InlineError error={update.error} />
      <Button title="Continue" onPress={save} loading={update.isPending} disabled={!canSave} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800' },
  help: { fontSize: 15, marginTop: 4, marginBottom: 20 },
});
