import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PartnersStackParams } from '../../app/navigation-types';
import { Card } from '../../shared/components/Card';
import { LogoImage } from '../../shared/components/LogoImage';
import { Screen } from '../../shared/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../shared/components/StateViews';
import { useTheme } from '../../shared/theme/theme';
import { usePartner } from './partners-api';

type Props = NativeStackScreenProps<PartnersStackParams, 'Partner'>;

export function PartnerScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const partner = usePartner(route.params.id);

  if (partner.isPending) return <LoadingView />;
  if (partner.isError) return <ErrorView error={partner.error} onRetry={() => partner.refetch()} />;
  const p = partner.data;

  const contact = (label: string, value: string | null, url?: string) =>
    value ? (
      <Pressable accessibilityRole={url ? 'link' : 'text'} disabled={!url} onPress={() => url && Linking.openURL(url)} style={[styles.contact, { minHeight: theme.minTapSize }]}>
        <Text style={{ color: theme.colors.textMuted }}>{label}</Text>
        <Text style={[styles.contactValue, { color: url ? theme.colors.primary : theme.colors.text }]}>{value}</Text>
      </Pressable>
    ) : null;

  return (
    <Screen refreshing={partner.isRefetching} onRefresh={() => partner.refetch()}>
      <View style={styles.header}>
        <LogoImage uri={p.logoUrl} name={p.name} size={64} />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: theme.colors.text }]}>{p.name}</Text>
          <Text style={{ color: theme.colors.textMuted }}>{p.category.name}</Text>
        </View>
      </View>
      {p.description ? <Text style={[styles.body, { color: theme.colors.text }]}>{p.description}</Text> : null}

      <Card>
        <Text style={[styles.section, { color: theme.colors.text }]}>How to redeem</Text>
        <Text style={{ color: theme.colors.text }}>{p.redemptionMethod}</Text>
      </Card>

      <Card>
        <Text style={[styles.section, { color: theme.colors.text }]}>Contact</Text>
        {contact('Address', p.address)}
        {contact('Phone', p.phone, p.phone ? `tel:${p.phone.replace(/[^+0-9]/g, '')}` : undefined)}
        {contact('Email', p.email, p.email ? `mailto:${p.email}` : undefined)}
      </Card>

      <Text style={[styles.section, { color: theme.colors.text }]}>Offers</Text>
      {p.offers.length === 0 ? (
        <EmptyView title="No live offers right now" />
      ) : (
        p.offers.map((offer) => (
          <Pressable key={offer.id} accessibilityRole="button" onPress={() => navigation.navigate('Offer', { id: offer.id, partnerName: p.name, redemptionMethod: p.redemptionMethod })}>
            <Card>
              <Text style={[styles.offerTitle, { color: theme.colors.text }]}>{offer.title}</Text>
              {offer.terms ? <Text style={{ color: theme.colors.textMuted }} numberOfLines={2}>{offer.terms}</Text> : null}
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  headerText: { flex: 1 },
  name: { fontSize: 22, fontWeight: '800' },
  body: { fontSize: 15, marginBottom: 16 },
  section: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  offerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  contact: { justifyContent: 'center' },
  contactValue: { fontSize: 15 },
});
