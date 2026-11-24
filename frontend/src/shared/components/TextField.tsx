import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, onFocus, onBlur, ...input }: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? theme.colors.danger : focused ? theme.colors.primary : theme.colors.border;
  return (
    <View style={styles.wrapper}>
      <Text style={[theme.type.overline, styles.label, { color: focused ? theme.colors.primary : theme.colors.textMuted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.textFaint}
        selectionColor={theme.colors.primary}
        keyboardAppearance="dark"
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            borderRadius: theme.radiusSm + 2,
            color: theme.colors.text,
            backgroundColor: theme.colors.surfaceRaised,
            borderColor,
          },
          style,
        ]}
        {...input}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: { marginBottom: 8 },
  input: { minHeight: 52, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  error: { fontSize: 13, marginTop: 6 },
});
