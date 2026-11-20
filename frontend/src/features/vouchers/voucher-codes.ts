import { readSecure, SecureKeys, writeSecure } from '../../shared/storage/secure-store';

/**
 * The server returns a voucher's full code only once, at claim time. The app keeps it in the
 * secure store (never logs) so the member can show it at checkout later.
 */
export async function saveVoucherCode(voucherId: string, code: string): Promise<void> {
  const codes = (await readSecure<Record<string, string>>(SecureKeys.voucherCodes)) ?? {};
  codes[voucherId] = code;
  await writeSecure(SecureKeys.voucherCodes, codes);
}

export async function getVoucherCode(voucherId: string): Promise<string | null> {
  const codes = await readSecure<Record<string, string>>(SecureKeys.voucherCodes);
  return codes?.[voucherId] ?? null;
}
