import { getApp } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  deleteToken,
  getInitialNotification,
  getMessaging,
  getToken,
  hasPermission,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { api } from '../../shared/api/client';
import { sessionStore } from '../../shared/api/session';
import { logger } from '../../shared/logger';

export type PushTarget = { screen: 'voucher'; voucherId: string } | { screen: 'card' };

const messaging = () => getMessaging(getApp());
const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

/** True when we have not asked yet, so the app can explain why before the system prompt. */
export async function shouldAskForPushPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      return !(await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS));
    }
    return (await hasPermission(messaging())) === AuthorizationStatus.NOT_DETERMINED;
  } catch {
    return false;
  }
}

export async function requestPushPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  const status = await requestPermission(messaging());
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

async function sendToken(fcmToken: string): Promise<void> {
  if (!sessionStore.peek()) return;
  await api.POST('/api/v1/devices', { body: { fcmToken, platform } });
}

/** Registers this device's FCM token with the backend and keeps it updated. Returns an unsubscribe. */
export async function registerDevice(): Promise<() => void> {
  try {
    const status = await hasPermission(messaging());
    if (status !== AuthorizationStatus.AUTHORIZED && status !== AuthorizationStatus.PROVISIONAL) return () => undefined;
    await sendToken(await getToken(messaging()));
    return onTokenRefresh(messaging(), (token) => {
      sendToken(token).catch((err: unknown) => logger.warn('push token refresh failed', { err: String(err) }));
    });
  } catch (err) {
    logger.warn('push registration failed', { err: String(err) });
    return () => undefined;
  }
}

/** On logout: tell the backend to stop sending here, then drop the local token. */
export async function unregisterDevice(): Promise<void> {
  try {
    const token = await getToken(messaging());
    await api.POST('/api/v1/devices/unregister', { body: { fcmToken: token } });
    await deleteToken(messaging());
  } catch (err) {
    logger.warn('push unregister failed', { err: String(err) });
  }
}

/** Maps a notification's data payload (no personal data, no codes) to a screen. */
export function targetFromData(data: Record<string, unknown> | undefined): PushTarget | null {
  if (!data) return null;
  if (typeof data.voucherId === 'string' && data.voucherId) return { screen: 'voucher', voucherId: data.voucherId };
  if (data.screen === 'card' || data.kind === 'membership_expiring') return { screen: 'card' };
  return null;
}

/** Calls `open` for notifications tapped while the app was in the background or closed. */
export function listenForNotificationOpens(open: (target: PushTarget) => void): () => void {
  try {
    getInitialNotification(messaging())
      .then((msg) => {
        const target = targetFromData(msg?.data);
        if (target) open(target);
      })
      .catch(() => undefined);
    return onNotificationOpenedApp(messaging(), (msg) => {
      const target = targetFromData(msg.data);
      if (target) open(target);
    });
  } catch (err) {
    logger.warn('push listener failed', { err: String(err) });
    return () => undefined;
  }
}
