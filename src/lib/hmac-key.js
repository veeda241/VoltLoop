export const DEFAULT_HMAC_SECRET = "voltloop-demo-hmac-key-2026";

export function hmacKeyBytes(
  secret = import.meta.env.VITE_VOLTLOOP_HMAC_KEY || DEFAULT_HMAC_SECRET,
) {
  return new TextEncoder().encode(secret);
}
