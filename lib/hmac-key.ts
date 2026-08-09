import { keyFromSecret } from "@protocol/hmac";

export const DEFAULT_HMAC_SECRET = "voltloop-demo-hmac-key-2026";

export function getHmacKey(): Uint8Array {
  return keyFromSecret(process.env.VOLTLOOP_HMAC_KEY || DEFAULT_HMAC_SECRET);
}

export function getHmacSecret(): string {
  return process.env.VOLTLOOP_HMAC_KEY || DEFAULT_HMAC_SECRET;
}
