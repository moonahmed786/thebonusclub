import { DarkTheme, DefaultTheme, NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useRef } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../features/auth/AuthProvider';
import { listenForNotificationOpens, PushTarget } from '../features/notifications/push';
import { sessionStore } from '../shared/api/session';
import { queryClient } from '../shared/queryClient';
import type { MainTabParams } from './navigation-types';
import { RootNavigator } from './RootNavigator';

const navigationRef = createNavigationContainerRef<MainTabParams>();

export function App() {
  const scheme = useColorScheme();
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
          <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
          <NavigationContainer
            ref={navigationRef}
            theme={scheme === 'dark' ? DarkTheme : DefaultTheme}
            onStateChange={() => pending.current && openTarget(pending.current)}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
