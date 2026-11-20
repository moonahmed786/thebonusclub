import * as Keychain from 'react-native-keychain';

// Everything sensitive lives in the Keychain (iOS) / Keystore (Android), never AsyncStorage.
const SERVICE_PREFIX = 'com.thebonusclub.app';

export const SecureKeys = {
  session: `${SERVICE_PREFIX}.session`,
  card: `${SERVICE_PREFIX}.card`,
  voucherCodes: `${SERVICE_PREFIX}.voucher-codes`,
} as const;

type SecureKey = (typeof SecureKeys)[keyof typeof SecureKeys];

export async function writeSecure<T>(key: SecureKey, value: T): Promise<void> {
  await Keychain.setGenericPassword('data', JSON.stringify(value), {
    service: key,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}

export async function readSecure<T>(key: SecureKey): Promise<T | null> {
  const result = await Keychain.getGenericPassword({ service: key });
  if (!result) return null;
  try {
    return JSON.parse(result.password) as T;
  } catch {
    return null;
  }
}

export async function deleteSecure(key: SecureKey): Promise<void> {
  await Keychain.resetGenericPassword({ service: key });
}

/** Called on logout: removes tokens, the cached card, and stored voucher codes. */
export async function clearAllSecure(): Promise<void> {
  await Promise.all(Object.values(SecureKeys).map((key) => deleteSecure(key)));
}
