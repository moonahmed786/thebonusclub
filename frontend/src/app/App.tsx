import { DarkTheme, NavigationContainer, Theme as NavigationTheme, createNavigationContainerRef } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../features/auth/AuthProvider';
import { listenForNotificationOpens, PushTarget } from '../features/notifications/push';
import { sessionStore } from '../shared/api/session';
import { queryClient } from '../shared/queryClient';
import { brandTheme } from '../shared/theme/theme';
import type { MainTabParams } from './navigation-types';
import { RootNavigator } from './RootNavigator';

const navigationRef = createNavigationContainerRef<MainTabParams>();

const navigationTheme: NavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: brandTheme.colors.primary,
    background: brandTheme.colors.background,
    card: brandTheme.colors.background,
    text: brandTheme.colors.text,
    border: brandTheme.colors.border,
    notification: brandTheme.colors.primary,
  },
};

export function App() {
  const pending = useRef<PushTarget | null>(null);

  const openTarget = (target: PushTarget) => {
    // Only navigate for a signed-in member whose tabs are mounted; otherwise remember it.
    if (!sessionStore.peek() || !navigationRef.isReady() || !navigationRef.getRootState()?.routeNames?.includes('CardTab')) {
      pending.current = target;
      return;
    }
    pending.current = null;
    if (target.screen === 'voucher') {
      navigationRef.navigate('VouchersTab', { screen: 'Voucher', params: { id: target.voucherId }, initial: false });
    } else {
      navigationRef.navigate('CardTab');
    }
  };

  useEffect(() => listenForNotificationOpens(openTarget), []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar barStyle="light-content" />
          <NavigationContainer
            ref={navigationRef}
            theme={navigationTheme}
            onStateChange={() => pending.current && openTarget(pending.current)}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
