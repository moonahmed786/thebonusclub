/* eslint-env jest */
/* Native-module mocks for unit and component tests. */
jest.mock('@react-native-clipboard/clipboard', () => require('@react-native-clipboard/clipboard/jest/clipboard-mock'));

jest.mock('react-native-keychain', () => {
  const store = new Map();
  return {
    ACCESSIBLE: { AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AfterFirstUnlockThisDeviceOnly' },
    setGenericPassword: jest.fn(async (username, password, options) => {
      store.set(options?.service ?? 'default', { username, password, service: options?.service });
      return { service: options?.service, storage: 'test' };
    }),
    getGenericPassword: jest.fn(async (options) => store.get(options?.service ?? 'default') ?? false),
    resetGenericPassword: jest.fn(async (options) => store.delete(options?.service ?? 'default')),
  };
});

jest.mock('@react-native-firebase/app', () => ({ getApp: jest.fn(() => ({})) }));
jest.mock('@react-native-firebase/messaging', () => ({
  AuthorizationStatus: { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 },
  getMessaging: jest.fn(() => ({})),
  hasPermission: jest.fn(async () => -1),
  requestPermission: jest.fn(async () => 1),
  getToken: jest.fn(async () => 'test-fcm-token'),
  deleteToken: jest.fn(async () => undefined),
  onTokenRefresh: jest.fn(() => () => undefined),
  onNotificationOpenedApp: jest.fn(() => () => undefined),
  getInitialNotification: jest.fn(async () => null),
  setBackgroundMessageHandler: jest.fn(),
}));
