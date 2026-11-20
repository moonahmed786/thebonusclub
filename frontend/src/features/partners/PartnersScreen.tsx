import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PartnersStackParams } from '../../app/navigation-types';
import { Card } from '../../shared/components/Card';
import { LogoImage } from '../../shared/components/LogoImage';
import { EmptyView, ErrorView, LoadingView } from '../../shared/components/StateViews';
import { useTheme } from '../../shared/theme/theme';
import { useCategories, usePartners } from './partners-api';

type Props = NativeStackScreenProps<PartnersStackParams, 'Partners'>;

export function PartnersScreen({ navigation }: Props) {
  const theme = useTheme();
  const [category, setCategory] = useState<string | null>(null);
  const categories = useCategories();
  const partners = usePartners(category);

  const chips = [{ slug: null as string | null, name: 'All' }, ...(categories.data ?? []).map((c) => ({ slug: c.slug as string | null, name: c.name }))];

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipBar}>
        {chips.map((chip) => {
          const selected = chip.slug === category;
          return (
            <Pressable
              key={chip.slug ?? 'all'}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setCategory(chip.slug)}
              style={[
                styles.chip,
                { minHeight: theme.minTapSize, backgroundColor: selected ? theme.colors.primary : theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.border },
              ]}>
              <Text style={[styles.chipText, { color: selected ? theme.colors.onPrimary : theme.colors.text }]}>{chip.name}</Text>
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
          data={partners.items ?? []}
          keyExtractor={(p) => p.id}
          refreshControl={<RefreshControl refreshing={partners.isRefetching} onRefresh={() => {
            partners.refetch();
          }} tintColor={theme.colors.primary} />}
          ListEmptyComponent={<EmptyView title="No partners here yet" message="Try another category." />}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Partner', { id: item.id, name: item.name })}>
              <Card style={styles.row}>
                <LogoImage uri={item.logoUrl} name={item.name} />
                <View style={styles.rowText}>
                  <Text style={[styles.name, { color: theme.colors.text }]}>{item.name}</Text>
                  <Text style={{ color: theme.colors.textMuted }}>
                    {item.category.name} · {item.liveOfferCount} {item.liveOfferCount === 1 ? 'offer' : 'offers'}
                  </Text>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  chipBar: { flexGrow: 0 },
  chips: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center' },
  chipText: { fontWeight: '600' },
  list: { padding: 16, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700' },
});
