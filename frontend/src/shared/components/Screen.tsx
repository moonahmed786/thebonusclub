import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';

export interface LargeHeaderProps {
  /** Small gold label above the title. */
  overline?: string;
  title: string;
  subtitle?: string;
  /** Element shown at the top right, e.g. a ghost button. */
  right?: React.ReactNode;
}

/** Big in-screen title used by tab root screens, which hide the navigation bar. */
export function LargeHeader({ overline, title, subtitle, right }: LargeHeaderProps) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          {overline ? <Text style={[theme.type.overline, { color: theme.colors.primary }]}>{overline}</Text> : null}
          <Text accessibilityRole="header" style={[theme.type.display, styles.headerTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
        </View>
        {right}
      </View>
      {subtitle ? <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Renders a large header and pads for the status bar (use on screens without a navigation bar). */
  header?: LargeHeaderProps;
  /** Pinned below the scrolling content, e.g. a primary action. */
  footer?: React.ReactNode;
  /** Pads for the status bar without a header (screens with no navigation bar). */
  topInset?: boolean;
}

export function Screen({ children, scroll = true, refreshing = false, onRefresh, header, footer, topInset = false }: ScreenProps) {
  const theme = useTheme();
  const edges: Edge[] = header || topInset ? ['top', 'left', 'right', 'bottom'] : ['left', 'right', 'bottom'];
  const body = (
    <>
      {header ? <LargeHeader {...header} /> : null}
      {children}
    </>
  );
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      indicatorStyle="white"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} /> : undefined}>
      {body}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill]}>{body}</View>
  );
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      {content}
      {footer ? <View style={[styles.footer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, flexGrow: 1 },
  header: { marginBottom: 20, marginTop: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1 },
  headerTitle: { marginTop: 4, marginBottom: 4 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
});
