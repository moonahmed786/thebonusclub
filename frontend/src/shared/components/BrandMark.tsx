import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, withAlpha } from '../theme/theme';

/** The club's gold "BC" monogram inside a double ring. */
export function BrandMark({ size = 72 }: { size?: number }) {
  const theme = useTheme();
  const gold = theme.colors.primary;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="The Bonus Club"
      style={[styles.outer, { width: size, height: size, borderRadius: size / 2, borderColor: withAlpha(gold, 0.35) }]}>
      <View
        style={[
          styles.inner,
          { width: size - 10, height: size - 10, borderRadius: (size - 10) / 2, borderColor: gold, backgroundColor: withAlpha(gold, 0.08) },
        ]}>
        <Text style={[styles.letters, { color: theme.colors.primaryBright, fontSize: size * 0.3 }]}>BC</Text>
      </View>
    </View>
  );
}

/** "THE BONUS CLUB" wordmark in spaced gold capitals. */
export function Wordmark({ size = 12 }: { size?: number }) {
  const theme = useTheme();
  return <Text style={[styles.wordmark, { color: theme.colors.primary, fontSize: size, letterSpacing: size * 0.32 }]}>THE BONUS CLUB</Text>;
}

const styles = StyleSheet.create({
  outer: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  letters: { fontWeight: '800', letterSpacing: 1 },
  wordmark: { fontWeight: '800' },
});
