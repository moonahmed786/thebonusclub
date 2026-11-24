import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PartnersStackParams } from '../../app/navigation-types';
import { Card } from '../../shared/components/Card';
import { LogoImage } from '../../shared/components/LogoImage';
import { Screen } from '../../shared/components/Screen';
import { InfoRow, SectionTitle } from '../../shared/components/Section';
import { EmptyView, ErrorView, LoadingView } from '../../shared/components/StateViews';
import { useTheme } from '../../shared/theme/theme';
import { formatDate } from '../../shared/utils/format';
import { usePartner } from './partners-api';

type Props = NativeStackScreenProps<PartnersStackParams, 'Partner'>;

export function PartnerScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const partner = usePartner(route.params.id);

  if (partner.isPending) return <LoadingView />;
  if (partner.isError) return <ErrorView error={partner.error} onRetry={() => partner.refetch()} />;
  const p = partner.data;

  const contact = (glyph: string, label: string, value: string | null, url?: string) =>
    value ? (
      <Pressable key={label} accessibilityRole={url ? 'link' : 'text'} disabled={!url} onPress={() => url && Linking.openURL(url)}>
        <InfoRow glyph={glyph} label={label} value={value} valueColor={url ? colors.primaryBright : undefined} />
      </Pressable>
    ) : null;
  const contacts = [
    contact('⌖', 'Address', p.address),
    contact('✆', 'Phone', p.phone, p.phone ? `tel:${p.phone.replace(/[^+0-9]/g, '')}` : undefined),
    contact('✉', 'Email', p.email, p.email ? `mailto:${p.email}` : undefined),
  ].filter(Boolean);

  return (
    <Screen refreshing={partner.isRefetching} onRefresh={() => partner.refetch()}>
      <View style={styles.hero}>
        <LogoImage uri={p.logoUrl} name={p.name} size={84} />
        <Text style={[theme.type.overline, styles.category, { color: colors.primary }]}>{p.category.name}</Text>
        <Text accessibilityRole="header" style={[theme.type.title, styles.name, { color: colors.text }]}>
          {p.name}
        </Text>
        {p.description ? <Text style={[theme.type.body, styles.description, { color: colors.textMuted }]}>{p.description}</Text> : null}
      </View>

      <SectionTitle title="Offers" note={p.offers.length ? `${p.offers.length} live` : undefined} />
      {p.offers.length === 0 ? (
        <EmptyView glyph="✦" title="No live offers right now" message="Check back soon." />
      ) : (
        p.offers.map((offer) => (
          <Pressable
            key={offer.id}
            accessibilityRole="button"
            accessibilityHint="Opens the offer so you can claim a voucher"
            onPress={() => navigation.navigate('Offer', { id: offer.id, partnerName: p.name, redemptionMethod: p.redemptionMethod })}>
            {({ pressed }) => (
              <Card accent style={pressed ? { backgroundColor: colors.surfaceRaised } : undefined}>
                <View style={styles.offerRow}>
                  <View style={styles.offerText}>
                    <Text style={[styles.offerTitle, { color: colors.text }]}>{offer.title}</Text>
                    {offer.description ? (
                      <Text style={[theme.type.caption, { color: colors.textMuted }]} numberOfLines={2}>
                        {offer.description}
                      </Text>
                    ) : null}
                    {offer.endsAt ? <Text style={[theme.type.caption, styles.ends, { color: colors.textFaint }]}>Ends {formatDate(offer.endsAt)}</Text> : null}
                  </View>
                  <Text style={[styles.cta, { color: colors.primary }]}>View ›</Text>
                </View>
              </Card>
            )}
          </Pressable>
        ))
      )}

      <SectionTitle title="How to redeem" />
      <Card>
        <Text style={[theme.type.body, { color: colors.text }]}>{p.redemptionMethod}</Text>
      </Card>

      {contacts.length ? (
        <>
          <SectionTitle title="Contact" />
          <Card>{contacts}</Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 20 },
  category: { marginTop: 16 },
  name: { textAlign: 'center', marginTop: 6 },
  description: { textAlign: 'center', marginTop: 10 },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  offerText: { flex: 1 },
  offerTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  ends: { marginTop: 6 },
  cta: { fontSize: 14, fontWeight: '700' },
});
