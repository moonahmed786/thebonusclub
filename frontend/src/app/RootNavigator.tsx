import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
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
import { Button } from '../shared/components/Button';
import { ErrorView, LoadingView } from '../shared/components/StateViews';
import type { AuthStackParams, MainTabParams, PartnersStackParams, VouchersStackParams } from './navigation-types';

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const PartnersStack = createNativeStackNavigator<PartnersStackParams>();
const VouchersStack = createNativeStackNavigator<VouchersStackParams>();
const CardStack = createNativeStackNavigator<{ Card: undefined }>();
const Tabs = createBottomTabNavigator<MainTabParams>();

const tabIcon = (glyph: string) => ({ color }: { color: string }) => <Text style={[styles.tabIcon, { color }]}>{glyph}</Text>;

function SignOutButton() {
  const { signOut } = useAuth();
  return <Button title="Sign out" variant="secondary" onPress={() => signOut()} />;
}

function CardStackScreen() {
  return (
    <CardStack.Navigator>
      <CardStack.Screen name="Card" component={CardScreen} options={{ title: 'Membership', headerRight: SignOutButton }} />
    </CardStack.Navigator>
  );
}

function PartnersStackScreen() {
  return (
    <PartnersStack.Navigator>
      <PartnersStack.Screen name="Partners" component={PartnersScreen} />
      <PartnersStack.Screen name="Partner" component={PartnerScreen} options={({ route }) => ({ title: route.params.name })} />
      <PartnersStack.Screen name="Offer" component={OfferScreen} options={{ title: 'Offer' }} />
    </PartnersStack.Navigator>
  );
}

function VouchersStackScreen() {
  return (
    <VouchersStack.Navigator>
      <VouchersStack.Screen name="Vouchers" component={VouchersScreen} />
      <VouchersStack.Screen name="Voucher" component={VoucherScreen} options={{ title: 'Voucher' }} />
    </VouchersStack.Navigator>
  );
}

function MainTabs() {
  return (
    <>
      <Tabs.Navigator screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="CardTab" component={CardStackScreen} options={{ title: 'Card', tabBarIcon: tabIcon('▭') }} />
        <Tabs.Screen name="PartnersTab" component={PartnersStackScreen} options={{ title: 'Partners', tabBarIcon: tabIcon('◎') }} />
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
      <AuthStack.Navigator>
        <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account' }} />
      </AuthStack.Navigator>
    );
  }
  return <MemberRoot />;
}

const styles = StyleSheet.create({
  tabIcon: { fontSize: 18 },
});
