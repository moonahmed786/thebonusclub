import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme, withAlpha } from '../theme/theme';

/** Partner logo with a gold monogram placeholder; a missing or broken logo never breaks layout. */
export function LogoImage({ uri, name, size = 48 }: { uri: string | null; name: string; size?: number }) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size, borderRadius: size * 0.28 };
  if (!uri || failed) {
    const initials = name
      .split(/\s+/)
      .filter((w) => /^[A-Za-z0-9]/.test(w))
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
    return (
      <View
        style={[styles.placeholder, box, { backgroundColor: withAlpha(theme.colors.primary, 0.12), borderColor: withAlpha(theme.colors.primary, 0.35) }]}
        accessibilityLabel={`${name} logo`}>
        <Text style={[styles.initials, { color: theme.colors.primaryBright, fontSize: size * 0.36 }]}>{initials}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={box} onError={() => setFailed(true)} accessibilityLabel={`${name} logo`} />;
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  initials: { fontWeight: '800', letterSpacing: 0.5 },
});
