import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PartnersStackParams } from '../../app/navigation-types';
import { LogoImage } from '../../shared/components/LogoImage';
import { LargeHeader } from '../../shared/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../shared/components/StateViews';
import { useTheme, withAlpha } from '../../shared/theme/theme';
import { useCategories, usePartners } from './partners-api';

type Props = NativeStackScreenProps<PartnersStackParams, 'Partners'>;

export function PartnersScreen({ navigation }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const [category, setCategory] = useState<string | null>(null);
  const categories = useCategories();
  const partners = usePartners(category);

  const chips = [{ slug: null as string | null, name: 'All' }, ...(categories.data ?? []).map((c) => ({ slug: c.slug as string | null, name: c.name }))];
  const items = partners.items ?? [];
  const offerCount = items.reduce((n, p) => n + p.liveOfferCount, 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <View style={styles.headerPad}>
        <LargeHeader
          overline="Members' privileges"
          title="Partners"
          subtitle={partners.items ? `${items.length} ${items.length === 1 ? 'partner' : 'partners'} · ${offerCount} live ${offerCount === 1 ? 'offer' : 'offers'}` : undefined}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipBar}>
        {chips.map((chip) => {
          const selected = chip.slug === category;
          return (
            <Pressable
              key={chip.slug ?? 'all'}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setCategory(chip.slug)}
              style={({ pressed }) => [
                styles.chip,
                {
                  minHeight: 38,
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Text style={[styles.chipText, { color: selected ? colors.onPrimary : colors.textMuted }]}>{chip.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {partners.isPending ? (
        <LoadingView label="Loading partners…" />
      ) : partners.error && !partners.items ? (
        <ErrorView error={partners.error} onRetry={() => partners.refetch()} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={items}
          keyExtractor={(p) => p.id}
          indicatorStyle="white"
          refreshControl={<RefreshControl refreshing={partners.isRefetching} onRefresh={() => { partners.refetch(); }} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyView glyph="❖" title="No partners here yet" message="Try another category." />}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.category.name}, ${item.liveOfferCount} offers`}
              onPress={() => navigation.navigate('Partner', { id: item.id, name: item.name })}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderColor: colors.border, borderRadius: theme.radius },
              ]}>
              <LogoImage uri={item.logoUrl} name={item.name} size={52} />
              <View style={styles.rowText}>
                <Text style={[theme.type.overline, { color: colors.textFaint }]}>{item.category.name}</Text>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              {item.liveOfferCount > 0 ? (
                <View style={[styles.pill, { backgroundColor: withAlpha(colors.primary, 0.14), borderColor: withAlpha(colors.primary, 0.4) }]}>
                  <Text style={[styles.pillText, { color: colors.primaryBright }]}>
                    {item.liveOfferCount} {item.liveOfferCount === 1 ? 'offer' : 'offers'}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.chevron, { color: colors.textFaint }]}>›</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerPad: { paddingHorizontal: 20, paddingTop: 4 },
  chipBar: { flexGrow: 0 },
  chips: { paddingHorizontal: 20, paddingBottom: 14, gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center' },
  chipText: { fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth * 2 },
  rowText: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', marginTop: 3 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
  chevron: { fontSize: 26, fontWeight: '300', marginLeft: 2 },
});
