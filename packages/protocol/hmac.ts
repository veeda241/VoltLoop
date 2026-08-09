import { HMAC_SIZE, type VoltLoopFrame } from "./types";
import { signedBytes } from "./frame";

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function importKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", toArrayBuffer(keyBytes), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function hmacSha256Trunc16(data: Uint8Array, keyBytes: Uint8Array): Promise<Uint8Array> {
  const key = await importKey(keyBytes);
  const sig = await crypto.subtle.sign("HMAC", key, toArrayBuffer(data));
  return new Uint8Array(sig).slice(0, HMAC_SIZE);
}

export async function signFrame(
  unsigned: Omit<VoltLoopFrame, "hmac">,
  keyBytes: Uint8Array,
): Promise<VoltLoopFrame> {
  const hmac = await hmacSha256Trunc16(signedBytes(unsigned), keyBytes);
  return { ...unsigned, hmac };
}

export async function verifyFrame(frame: VoltLoopFrame, keyBytes: Uint8Array): Promise<boolean> {
  const expected = await hmacSha256Trunc16(signedBytes(frame), keyBytes);
  if (expected.length !== frame.hmac.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ frame.hmac[i];
  return diff === 0;
}

export function keyFromSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}
