import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';
import { useAuth } from '../features/auth/AuthProvider';
import { LoginScreen } from '../features/auth/LoginScreen';
import { RegisterScreen } from '../features/auth/RegisterScreen';
import { CardScreen } from '../features/membership/CardScreen';
import { useMember } from '../features/membership/membership-api';
import { PushPermissionPrompt } from '../features/notifications/PushPermissionPrompt';
import { AwaitingActivationScreen } from '../features/onboarding/AwaitingActivationScreen';
import { ChoosePlanScreen } from '../features/onboarding/ChoosePlanScreen';
import { ProfileSetupScreen } from '../features/onboarding/ProfileSetupScreen';
import { OfferScreen } from '../features/partners/OfferScreen';
import { PartnerScreen } from '../features/partners/PartnerScreen';
import { PartnersScreen } from '../features/partners/PartnersScreen';
import { VoucherScreen } from '../features/vouchers/VoucherScreen';
import { VouchersScreen } from '../features/vouchers/VouchersScreen';
import { ErrorView, LoadingView } from '../shared/components/StateViews';
import { brandTheme } from '../shared/theme/theme';
import type { AuthStackParams, MainTabParams, PartnersStackParams, VouchersStackParams } from './navigation-types';

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const PartnersStack = createNativeStackNavigator<PartnersStackParams>();
const VouchersStack = createNativeStackNavigator<VouchersStackParams>();
const CardStack = createNativeStackNavigator<{ Card: undefined }>();
const Tabs = createBottomTabNavigator<MainTabParams>();

const { colors } = brandTheme;

/** Detail screens get a minimal dark bar with a gold back arrow; tab roots draw their own large title. */
const stackOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text, fontWeight: '700' },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: colors.background },
};
const rootOptions: NativeStackNavigationOptions = { headerShown: false };

const tabIcon = (glyph: string) => ({ color, focused }: { color: string; focused: boolean }) => (
  <Text style={[styles.tabIcon, { color, transform: [{ scale: focused ? 1.12 : 1 }] }]}>{glyph}</Text>
);

function CardStackScreen() {
  return (
    <CardStack.Navigator screenOptions={stackOptions}>
      <CardStack.Screen name="Card" component={CardScreen} options={rootOptions} />
    </CardStack.Navigator>
  );
}

function PartnersStackScreen() {
  return (
    <PartnersStack.Navigator screenOptions={stackOptions}>
      <PartnersStack.Screen name="Partners" component={PartnersScreen} options={rootOptions} />
      <PartnersStack.Screen name="Partner" component={PartnerScreen} options={{ title: '' }} />
      <PartnersStack.Screen name="Offer" component={OfferScreen} options={{ title: '' }} />
    </PartnersStack.Navigator>
  );
}

function VouchersStackScreen() {
  return (
    <VouchersStack.Navigator screenOptions={stackOptions}>
      <VouchersStack.Screen name="Vouchers" component={VouchersScreen} options={rootOptions} />
      <VouchersStack.Screen name="Voucher" component={VoucherScreen} options={{ title: '' }} />
    </VouchersStack.Navigator>
  );
}

function MainTabs() {
  return (
    <>
      <Tabs.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarLabelStyle: styles.tabLabel,
        }}>
        <Tabs.Screen name="CardTab" component={CardStackScreen} options={{ title: 'Card', tabBarIcon: tabIcon('◆') }} />
        <Tabs.Screen name="PartnersTab" component={PartnersStackScreen} options={{ title: 'Partners', tabBarIcon: tabIcon('❖') }} />
        <Tabs.Screen name="VouchersTab" component={VouchersStackScreen} options={{ title: 'Vouchers', tabBarIcon: tabIcon('✦') }} />
      </Tabs.Navigator>
      <PushPermissionPrompt />
    </>
  );
}

/** Signed in: inactive members go through onboarding; active or expired members get the app. */
function MemberRoot() {
  const member = useMember();
  if (member.isPending) return <LoadingView />;
  if (member.isError) return <ErrorView error={member.error} onRetry={() => member.refetch()} />;
  const m = member.data;
  if (m.membershipStatus === 'inactive') {
    if (!m.firstName || !m.lastName) return <ProfileSetupScreen member={m} />;
    if (!m.plan) return <ChoosePlanScreen />;
    return <AwaitingActivationScreen member={m} />;
  }
  return <MainTabs />;
}

export function RootNavigator() {
  const { status } = useAuth();
  if (status === 'loading') return <LoadingView />;
  if (status === 'signedOut') {
    return (
      <AuthStack.Navigator screenOptions={stackOptions}>
        <AuthStack.Screen name="Login" component={LoginScreen} options={rootOptions} />
        <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: '' }} />
      </AuthStack.Navigator>
    );
  }
  return <MemberRoot />;
}

const styles = StyleSheet.create({
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
});
