import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/theme';

/** Partner logo with an initials placeholder; a missing or broken logo never breaks layout. */
export function LogoImage({ uri, name, size = 48 }: { uri: string | null; name: string; size?: number }) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size, borderRadius: size / 4 };
  if (!uri || failed) {
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
    return (
      <View style={[styles.placeholder, box, { backgroundColor: theme.colors.border }]} accessibilityLabel={`${name} logo`}>
        <Text style={[styles.initials, { color: theme.colors.text }]}>{initials}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={box} onError={() => setFailed(true)} accessibilityLabel={`${name} logo`} />;
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '700', fontSize: 16 },
});
